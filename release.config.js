/** @type {import('semantic-release').GlobalConfig} */
export default {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "refactor", release: "patch" },
          { type: "perf", release: "patch" },
          { type: "docs", release: "patch" },
          { type: "chore", release: false },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md"],
        message:
          "chore(release): set ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
}