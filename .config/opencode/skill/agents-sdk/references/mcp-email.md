# MCP Servers & Email Handling

## MCP Server Integration

Agents include a multi-server MCP client for connecting to external MCP servers.

### Add an MCP Server

```typescript
export class MyAgent extends Agent<Env, State> {
  @callable()
  async addServer(name: string, url: string) {
    const result = await this.addMcpServer(
      name,
      url,
      "https://my-worker.workers.dev",  // callback host for OAuth
      "agents"                            // routing prefix
    );

    if (result.state === "authenticating") {
      // OAuth required - redirect user to result.authUrl
      return { needsAuth: true, authUrl: result.authUrl };
    }

    return { ready: true, id: result.id };
  }
}
```

### Use MCP Tools

```typescript
async onChatMessage() {
  // Get AI-compatible tools from all connected MCP servers
  const mcpTools = this.mcp.getAITools();
  
  const allTools = {
    ...localTools,
    ...mcpTools
  };

  const result = streamText({
    model: openai("gpt-4o"),
    messages: await convertToModelMessages(this.messages),
    tools: allTools
  });
  
  return result.toUIMessageStreamResponse();
}
```

### List MCP Resources

```typescript
// List all registered servers
const servers = this.mcp.listServers();

// List tools from all servers
const tools = this.mcp.listTools();

// List resources
const resources = this.mcp.listResources();

// List prompts
const prompts = this.mcp.listPrompts();
```

### Remove Server

```typescript
await this.removeMcpServer(serverId);
```

## Building an MCP Server

Use `McpAgent` to create an MCP server as a Durable Object:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

type State = { counter: number };

export class MyMCP extends McpAgent<Env, State, {}> {
  server = new McpServer({
    name: "MyMCPServer",
    version: "1.0.0"
  });

  initialState = { counter: 0 };

  async init() {
    // Register a resource
    this.server.resource("counter", "mcp://resource/counter", (uri) => ({
      contents: [{ text: String(this.state.counter), uri: uri.href }]
    }));

    // Register a tool
    this.server.registerTool(
      "increment",
      {
        description: "Increment the counter",
        inputSchema: { amount: z.number().default(1) }
      },
      async ({ amount }) => {
        this.setState({ counter: this.state.counter + amount });
        return {
          content: [{ text: `Counter: ${this.state.counter}`, type: "text" }]
        };
      }
    );
  }
}
```

### Serve MCP Server

```typescript
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // SSE transport (legacy)
    if (url.pathname.startsWith("/sse")) {
      return MyMCP.serveSSE("/sse", { binding: "MyMCP" }).fetch(request, env, ctx);
    }

    // Streamable HTTP transport (recommended)
    if (url.pathname.startsWith("/mcp")) {
      return MyMCP.serve("/mcp", { binding: "MyMCP" }).fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  }
};
```

## Email Handling

Agents can receive and reply to emails via Cloudflare Email Routing.

### Implement onEmail

```typescript
import { Agent, AgentEmail } from "agents";

export class EmailAgent extends Agent<Env, State> {
  async onEmail(email: AgentEmail) {
    console.log("From:", email.from);
    console.log("To:", email.to);
    console.log("Subject:", email.headers.get("subject"));

    // Get raw email content
    const raw = await email.getRaw();

    // Parse with postal-mime if needed
    const parsed = await PostalMime.parse(raw);

    // Update state
    this.setState({
      emails: [...this.state.emails, {
        from: email.from,
        subject: parsed.subject,
        text: parsed.text,
        timestamp: new Date()
      }]
    });

    // Reply
    await this.replyToEmail(email, {
      fromName: "My Agent",
      subject: `Re: ${email.headers.get("subject")}`,
      body: "Thanks for your email! I'll process it shortly.",
      contentType: "text/plain"
    });
  }
}
```

### Route Emails to Agent

```typescript
import { routeAgentEmail, createAddressBasedEmailResolver } from "agents";

export default {
  async email(message, env) {
    await routeAgentEmail(message, env, {
      resolver: createAddressBasedEmailResolver("EmailAgent")
    });
  },

  async fetch(request, env) {
    return routeAgentRequest(request, env) ?? new Response("Not found", { status: 404 });
  }
};
```

### Email Wrangler Config

```jsonc
{
  "send_email": [
    { "name": "SEB", "destination_address": "reply@yourdomain.com" }
  ]
}
```

Configure Email Routing in Cloudflare dashboard to forward to your Worker.

## Custom Email Resolvers

### Header-Based Resolver

Routes based on X-Agent headers in replies:

```typescript
import { createHeaderBasedEmailResolver } from "agents";

await routeAgentEmail(message, env, {
  resolver: createHeaderBasedEmailResolver()
});
```

### Custom Resolver

```typescript
const customResolver = async (email, env) => {
  // Parse recipient to determine agent
  const [localPart] = email.to.split("@");
  
  if (localPart.startsWith("support-")) {
    return {
      agentName: "SupportAgent",
      agentId: localPart.replace("support-", "")
    };
  }
  
  return null; // Don't route
};

await routeAgentEmail(message, env, { resolver: customResolver });
```
