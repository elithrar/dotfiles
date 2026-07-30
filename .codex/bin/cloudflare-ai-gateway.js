#!/usr/bin/env node

const { spawn } = require("node:child_process")
const crypto = require("node:crypto")
const fs = require("node:fs")
const http = require("node:http")
const os = require("node:os")
const path = require("node:path")

const APP = "https://opencode.cloudflare.dev"
const GATEWAY = "https://gateway.opencode.cloudflare.dev"
const HOST = "127.0.0.1"
const PORT = 41417
const HEALTH = "codex-cloudflare-ai-gateway-v1"
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex")
const SECRET_FILE = path.join(CODEX_HOME, "tmp", "cloudflare-ai-gateway-secret")

function healthSecret() {
  fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true, mode: 0o700 })
  try {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(32).toString("hex"), {
      flag: "wx",
      mode: 0o600,
    })
  } catch (error) {
    if (error.code !== "EEXIST") throw error
  }
  return fs.readFileSync(SECRET_FILE, "utf8").trim()
}

const HEALTH_SECRET = healthSecret()

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []
    request.on("data", (chunk) => chunks.push(chunk))
    request.on("end", () => resolve(Buffer.concat(chunks)))
    request.on("error", reject)
  })
}

function accessToken(request) {
  const authorization = request.headers.authorization || ""
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match?.[1]
}

function textContent(content) {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return content == null ? "" : JSON.stringify(content)

  const parts = content.flatMap((part) => {
    if (typeof part === "string") return [{ type: "text", text: part }]
    if (["input_text", "output_text", "text"].includes(part?.type)) {
      return [{ type: "text", text: part.text || "" }]
    }
    if (part?.type === "input_image" && part.image_url) {
      return [{ type: "image_url", image_url: { url: part.image_url } }]
    }
    return []
  })

  if (parts.every((part) => part.type === "text")) {
    return parts.map((part) => part.text).join("")
  }
  return parts
}

function toolOutput(output) {
  if (typeof output === "string") return output
  if (Array.isArray(output)) return textContent(output)
  return JSON.stringify(output ?? "")
}

function compatibilityRequest(responseRequest) {
  const messages = []
  if (responseRequest.instructions) {
    messages.push({ role: "system", content: responseRequest.instructions })
  }

  let pendingCalls = []
  const flushCalls = () => {
    if (!pendingCalls.length) return
    messages.push({ role: "assistant", content: null, tool_calls: pendingCalls })
    pendingCalls = []
  }

  for (const item of responseRequest.input || []) {
    if (item.type === "message") {
      flushCalls()
      const role = item.role === "developer" ? "system" : item.role
      messages.push({ role, content: textContent(item.content) })
    } else if (["function_call", "custom_tool_call"].includes(item.type)) {
      pendingCalls.push({
          id: item.call_id,
          type: "function",
          function: {
            name: item.name,
            arguments: item.arguments ?? JSON.stringify({ input: item.input || "" }),
          },
      })
    } else if (["function_call_output", "custom_tool_call_output"].includes(item.type)) {
      flushCalls()
      messages.push({
        role: "tool",
        tool_call_id: item.call_id,
        content: toolOutput(item.output),
      })
    }
  }
  flushCalls()

  const toolKinds = new Map()
  const tools = (responseRequest.tools || []).flatMap((tool) => {
    if (!tool?.name || !["function", "custom"].includes(tool.type)) return []
    toolKinds.set(tool.name, tool.type)
    const parameters = tool.type === "function"
      ? (tool.parameters || { type: "object", properties: {} })
      : {
          type: "object",
          properties: { input: { type: "string" } },
          required: ["input"],
          additionalProperties: false,
        }
    return [{
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters,
      },
    }]
  })

  const body = {
    model: responseRequest.model,
    messages,
    stream: false,
  }
  if (tools.length) body.tools = tools
  if (responseRequest.parallel_tool_calls != null) {
    body.parallel_tool_calls = responseRequest.parallel_tool_calls
  }
  if (responseRequest.reasoning?.effort) {
    body.reasoning_effort = responseRequest.reasoning.effort
  }
  if (responseRequest.max_output_tokens) {
    body.max_tokens = responseRequest.max_output_tokens
  }
  if (responseRequest.text?.format?.type === "json_schema") {
    const format = responseRequest.text.format
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: format.name,
        schema: format.schema,
        strict: format.strict,
      },
    }
  }

  return { body, toolKinds }
}

function responseEvents(chatResponse, toolKinds) {
  const id = chatResponse.id || `resp_${Date.now()}`
  const message = chatResponse.choices?.[0]?.message || {}
  const events = [{ type: "response.created", response: { id } }]

  const content = textContent(message.content)
  if (content) {
    events.push({
      type: "response.output_item.done",
      item: {
        type: "message",
        role: "assistant",
        id: `${id}_message`,
        content: [{ type: "output_text", text: content }],
      },
    })
  }

  for (const [index, call] of (message.tool_calls || []).entries()) {
    const name = call.function?.name || "unknown_tool"
    const argumentsJson = call.function?.arguments || "{}"
    if (toolKinds.get(name) === "custom") {
      let input = argumentsJson
      try {
        input = JSON.parse(argumentsJson).input ?? argumentsJson
      } catch {}
      events.push({
        type: "response.output_item.done",
        item: {
          type: "custom_tool_call",
          id: `${id}_tool_${index}`,
          call_id: call.id,
          name,
          input,
        },
      })
    } else {
      events.push({
        type: "response.output_item.done",
        item: {
          type: "function_call",
          id: `${id}_tool_${index}`,
          call_id: call.id,
          name,
          arguments: argumentsJson,
        },
      })
    }
  }

  const usage = chatResponse.usage || {}
  const finishReason = chatResponse.choices?.[0]?.finish_reason
  if (finishReason && !["stop", "tool_calls"].includes(finishReason)) {
    events.push({
      type: "response.incomplete",
      response: {
        id,
        object: "response",
        status: "incomplete",
        error: null,
        incomplete_details: { reason: finishReason },
      },
    })
  } else {
    events.push({
      type: "response.completed",
      response: {
        id,
        usage: {
          input_tokens: usage.prompt_tokens || 0,
          input_tokens_details: null,
          output_tokens: usage.completion_tokens || 0,
          output_tokens_details: null,
          total_tokens: usage.total_tokens || 0,
        },
      },
    })
  }
  return events
}

function writeEvents(response, events) {
  response.writeHead(200, {
    "cache-control": "no-cache",
    "content-type": "text/event-stream",
  })
  for (const event of events) {
    response.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
  }
  response.end()
}

async function proxyCompatibility(request, response, token, responseRequest) {
  const { body, toolKinds } = compatibilityRequest(responseRequest)
  const upstream = await fetch(`${GATEWAY}/compat/chat/completions`, {
    method: "POST",
    headers: {
      "cf-access-token": token,
      "content-type": "application/json",
      "x-requested-with": "xmlhttprequest",
    },
    body: JSON.stringify(body),
  })
  const result = await upstream.json()
  if (!upstream.ok) {
    response.writeHead(upstream.status, { "content-type": "application/json" })
    response.end(JSON.stringify(result))
    return
  }
  writeEvents(response, responseEvents(result, toolKinds))
}

async function proxyOpenAI(request, response, token, body) {
  const upstream = await fetch(`${GATEWAY}/openai/responses`, {
    method: "POST",
    headers: {
      "cf-access-token": token,
      "content-type": request.headers["content-type"] || "application/json",
      "x-requested-with": "xmlhttprequest",
    },
    body,
  })
  const headers = Object.fromEntries(upstream.headers)
  delete headers["content-encoding"]
  delete headers["content-length"]
  delete headers.connection
  response.writeHead(upstream.status, headers)
  if (!upstream.body) {
    response.end()
    return
  }
  for await (const chunk of upstream.body) response.write(chunk)
  response.end()
}

function serve() {
  const server = http.createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        const nonce = request.headers["x-codex-gateway-nonce"] || ""
        if (!/^[a-f0-9]{64}$/.test(nonce)) {
          response.writeHead(401)
          response.end("unauthorized")
          return
        }
        const signature = crypto.createHmac("sha256", HEALTH_SECRET).update(nonce).digest("hex")
        response.writeHead(200, { "content-type": "text/plain" })
        response.end(`${HEALTH}:${signature}`)
        return
      }
      if (request.method === "GET" && request.url === "/v1/models") {
        response.writeHead(200, { "content-type": "application/json" })
        response.end('{"object":"list","data":[]}')
        return
      }
      if (request.method !== "POST" || request.url !== "/v1/responses") {
        response.writeHead(404)
        response.end("not found")
        return
      }

      const token = accessToken(request)
      if (!token) {
        response.writeHead(401, { "www-authenticate": "Bearer" })
        response.end("missing bearer token")
        return
      }

      const body = await readBody(request)
      const parsed = JSON.parse(body)
      if (parsed.model?.includes("/")) {
        await proxyCompatibility(request, response, token, parsed)
      } else {
        await proxyOpenAI(request, response, token, body)
      }
    } catch (error) {
      if (!response.headersSent) response.writeHead(502)
      response.end(error instanceof Error ? error.message : String(error))
    }
  })
  server.listen(PORT, HOST)
}

function healthCheck() {
  return new Promise((resolve) => {
    const nonce = crypto.randomBytes(32).toString("hex")
    const expected = `${HEALTH}:${crypto.createHmac("sha256", HEALTH_SECRET).update(nonce).digest("hex")}`
    const request = http.get({
      host: HOST,
      port: PORT,
      path: "/health",
      timeout: 250,
      headers: { "x-codex-gateway-nonce": nonce },
    }, (response) => {
      let body = ""
      response.setEncoding("utf8")
      response.on("data", (chunk) => { body += chunk })
      response.on("end", () => resolve(response.statusCode === 200 && body === expected))
    })
    request.on("error", () => resolve(false))
    request.on("timeout", () => {
      request.destroy()
      resolve(false)
    })
  })
}

async function ensureServer() {
  if (await healthCheck()) return
  const child = spawn(process.execPath, [__filename, "--serve"], {
    detached: true,
    stdio: "ignore",
  })
  child.unref()
  for (let attempt = 0; attempt < 40; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    if (await healthCheck()) return
  }
  throw new Error(`Cloudflare AI Gateway adapter did not start on ${HOST}:${PORT}`)
}

function cloudflaredLogin() {
  return new Promise((resolve, reject) => {
    const child = spawn("cloudflared", ["access", "login", "--no-verbose", `-app=${APP}`], {
      stdio: ["ignore", "pipe", "inherit"],
    })
    let token = ""
    child.stdout.setEncoding("utf8")
    child.stdout.on("data", (chunk) => { token += chunk })
    child.on("error", reject)
    child.on("exit", (code) => {
      token = token.trim()
      if (code === 0 && token) resolve(token)
      else reject(new Error(`cloudflared access login failed with exit code ${code}`))
    })
  })
}

function selfTest() {
  const request = compatibilityRequest({
    model: "anthropic/claude-sonnet-5",
    instructions: "test",
    input: [
      { type: "message", role: "user", content: [{ type: "input_text", text: "hello" }] },
      { type: "function_call", call_id: "call_1", name: "one", arguments: "{}" },
      { type: "function_call", call_id: "call_2", name: "two", arguments: "{}" },
      { type: "function_call_output", call_id: "call_1", output: "one" },
      { type: "function_call_output", call_id: "call_2", output: "two" },
    ],
    tools: [{ type: "custom", name: "shell", description: "Run a command" }],
    text: { format: { type: "json_schema", name: "result", schema: { type: "object" }, strict: true } },
  })
  if (request.body.messages[1].content !== "hello") throw new Error("message conversion failed")
  if (request.body.tools[0].function.name !== "shell") throw new Error("tool conversion failed")
  if (request.body.messages[2].tool_calls.length !== 2) throw new Error("parallel tool conversion failed")
  if (request.body.response_format.json_schema.name !== "result") throw new Error("schema conversion failed")
  const events = responseEvents({
    id: "chat_1",
    choices: [{ message: { tool_calls: [{ id: "call_1", function: { name: "shell", arguments: '{"input":"pwd"}' } }] } }],
  }, request.toolKinds)
  if (events[1].item.input !== "pwd") throw new Error("tool response conversion failed")
}

async function main() {
  if (process.argv[2] === "--serve") {
    serve()
    return
  }
  if (process.argv[2] === "--self-test") {
    selfTest()
    return
  }
  await ensureServer()
  process.stdout.write(`${await cloudflaredLogin()}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
