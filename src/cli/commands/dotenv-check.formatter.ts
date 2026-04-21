import { DotenvCheckResult } from "./dotenv-check";

export function formatDotenvCheckText(results: DotenvCheckResult[]): string {
  return results
    .map((r) => {
      const existsMark = r.exists ? "✅" : "❌";
      const ignoredMark = r.inGitignore ? "✅" : "❌";
      const lines = [
        `File:       ${r.file}`,
        `Exists:     ${existsMark}`,
        `Git-ignored: ${ignoredMark}${
          r.inGitignorePath ? ` (${r.inGitignorePath})` : ""
        }`,
      ];
      if (r.warning) lines.push(`Warning:    ${r.warning}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatDotenvCheckJson(results: DotenvCheckResult[]): string {
  return JSON.stringify(results, null, 2);
}

export function formatDotenvCheckSummary(results: DotenvCheckResult[]): string {
  const total = results.length;
  const safe = results.filter((r) => r.exists && r.inGitignore).length;
  const missing = results.filter((r) => !r.exists).length;
  const exposed = results.filter((r) => r.exists && !r.inGitignore).length;
  return [
    `Total checked : ${total}`,
    `Safe          : ${safe}`,
    `Missing       : ${missing}`,
    `Exposed       : ${exposed}`,
  ].join("\n");
}
