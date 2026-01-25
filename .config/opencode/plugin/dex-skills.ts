import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, symlinkSync, unlinkSync, lstatSync } from "node:fs"
import { dirname, join } from "node:path"

/**
 * Plugin that symlinks dex skills from node_modules to the OpenCode skills directory.
 * This allows OpenCode to discover the bundled skills from @zeeg/dex.
 */
export const DexSkillsPlugin: Plugin = async ({ client }) => {
  const log = (message: string) =>
    client.app.log({
      service: "dex-skills",
      level: "info",
      message,
    })

  // Find the dex package location
  let dexPath: string
  try {
    // Try to resolve @zeeg/dex from the plugin directory
    const pluginDir = dirname(import.meta.path)
    const nodeModules = join(pluginDir, "..", "node_modules")
    dexPath = join(nodeModules, "@zeeg", "dex")

    if (!existsSync(dexPath)) {
      // Fallback: try global node_modules resolution
      const resolved = await import.meta.resolve?.("@zeeg/dex")
      if (resolved) {
        dexPath = dirname(resolved.replace("file://", ""))
      }
    }
  } catch {
    await log("@zeeg/dex not found, skipping skill symlinks")
    return { event: async () => {} }
  }

  const skillsSource = join(dexPath, "plugins", "dex", "skills")
  if (!existsSync(skillsSource)) {
    await log(`dex skills not found at ${skillsSource}`)
    return { event: async () => {} }
  }

  // Determine OpenCode skills directory
  const configDir = process.env.HOME
    ? join(process.env.HOME, ".config", "opencode", "skill")
    : null

  if (!configDir) {
    await log("could not determine config directory")
    return { event: async () => {} }
  }

  // Create skills directory if needed
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  // Symlink each skill
  const skills = ["dex", "dex-plan"]
  for (const skill of skills) {
    const source = join(skillsSource, skill)
    const target = join(configDir, skill)

    if (!existsSync(source)) {
      await log(`skill source not found: ${source}`)
      continue
    }

    try {
      // Remove existing symlink if it exists
      if (existsSync(target)) {
        const stat = lstatSync(target)
        if (stat.isSymbolicLink()) {
          unlinkSync(target)
        } else {
          await log(`${target} exists and is not a symlink, skipping`)
          continue
        }
      }

      symlinkSync(source, target)
      await log(`symlinked ${skill} skill from @zeeg/dex`)
    } catch (err) {
      await log(`failed to symlink ${skill}: ${err}`)
    }
  }

  return {
    event: async () => {},
  }
}
