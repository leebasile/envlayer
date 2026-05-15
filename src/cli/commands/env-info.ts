import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface EnvInfo {
  file: string;
  absolutePath: string;
  sizeBytes: number;
  lineCount: number;
  keyCount: number;
  commentCount: number;
  emptyLineCount: number;
  lastModified: Date;
  encoding: string;
}

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) map.set(key, val);
  }
  return map;
}

export function collectEnvInfo(filePath: string): EnvInfo {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf-8");
  const stat = fs.statSync(absolutePath);
  const lines = raw.split("\n");
  const keyCount = parseEnvFile(raw).size;
  const commentCount = lines.filter((l) => l.trim().startsWith("#")).length;
  const emptyLineCount = lines.filter((l) => l.trim() === "").length;

  return {
    file: path.basename(filePath),
    absolutePath,
    sizeBytes: stat.size,
    lineCount: lines.length,
    keyCount,
    commentCount,
    emptyLineCount,
    lastModified: stat.mtime,
    encoding: "utf-8",
  };
}

export function buildEnvInfoCommand(program: import("commander").Command) {
  program
    .command("env-info")
    .description("Display metadata and statistics about an env file")
    .argument("<file>", "Path to the .env file")
    .option("--json", "Output as JSON")
    .action((file: string, opts: { json?: boolean }) => {
      const info = collectEnvInfo(file);
      if (opts.json) {
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.log(`File:          ${info.file}`);
        console.log(`Path:          ${info.absolutePath}`);
        console.log(`Size:          ${info.sizeBytes} bytes`);
        console.log(`Lines:         ${info.lineCount}`);
        console.log(`Keys:          ${info.keyCount}`);
        console.log(`Comments:      ${info.commentCount}`);
        console.log(`Empty lines:   ${info.emptyLineCount}`);
        console.log(`Last modified: ${info.lastModified.toISOString()}`);
        console.log(`Encoding:      ${info.encoding}`);
      }
    });
}
