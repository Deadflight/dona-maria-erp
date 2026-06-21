import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

const projectRoot = path.resolve(__dirname, "..", "..")
const releaseWorkflowPath = path.join(projectRoot, ".github", "workflows", "release.yml")
const packageJsonPath = path.join(projectRoot, "package.json")

const verificationCommands = ["pnpm lint", "pnpm typecheck", "pnpm test", "pnpm build"]

function getReleaseWorkflow() {
  return fs.readFileSync(releaseWorkflowPath, "utf8")
}

function getCheckChain() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>
  }

  return packageJson.scripts?.check?.split(" && ") ?? []
}

describe("release workflow verification parity", () => {
  it("runs every local verification command before semantic-release", () => {
    const workflow = getReleaseWorkflow()
    const semanticReleaseIndex = workflow.indexOf("pnpm exec semantic-release")

    expect(semanticReleaseIndex).toBeGreaterThan(-1)

    for (const command of verificationCommands) {
      const commandIndex = workflow.indexOf(command)

      expect(commandIndex, `${command} must exist in release workflow`).toBeGreaterThan(-1)
      expect(commandIndex, `${command} must run before semantic-release`).toBeLessThan(semanticReleaseIndex)
    }
  })

  it("keeps the workflow command order aligned with pnpm check", () => {
    const workflow = getReleaseWorkflow()
    const checkChain = getCheckChain()
    const actualSequence = verificationCommands
      .filter((command) => workflow.includes(command))

    expect(checkChain).toEqual(verificationCommands)
    expect(actualSequence).toEqual(verificationCommands)
  })
})
