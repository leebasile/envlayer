import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { findUnusedKeys, parseEnvFile } from "./unused";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-unused-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const map = parseEnvFile("FOO=bar\nBAZ=qux\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const map = parseEnvFile("# comment\n\nKEY=value\n");
    expect(map.size).toBe(1);
  });
});

describe("findUnusedKeys", () => {
  it("detects unused keys not referenced in sources", () => {
    const dir = makeTmpDir();
    const envFile = writeFile(dir, ".env", "USED_KEY=hello\nUNUSED_KEY=world\n");
    const srcFile = writeFile(dir, "app.ts", 'const x = process.env.USED_KEY;');
    const result = findUnusedKeys(envFile, [srcFile]);
    expect(result.unusedKeys.map((k) => k.key)).toContain("UNUSED_KEY");
    expect(result.unusedKeys.map((k) => k.key)).not.toContain("USED_KEY");
  });

  it("returns empty unusedKeys when all keys are referenced", () => {
    const dir = makeTmpDir();
    const envFile = writeFile(dir, ".env", "API_URL=http://localhost\n");
    const srcFile = writeFile(dir, "app.ts", 'const url = process.env.API_URL;');
    const result = findUnusedKeys(envFile, [srcFile]);
    expect(result.unusedKeys).toHaveLength(0);
  });

  it("handles bracket notation references", () => {
    const dir = makeTmpDir();
    const envFile = writeFile(dir, ".env", "SECRET=abc\n");
    const srcFile = writeFile(dir, "app.ts", "const s = process.env['SECRET'];");
    const result = findUnusedKeys(envFile, [srcFile]);
    expect(result.unusedKeys).toHaveLength(0);
  });

  it("reports correct totalKeys count", () => {
    const dir = makeTmpDir();
    const envFile = writeFile(dir, ".env", "A=1\nB=2\nC=3\n");
    const srcFile = writeFile(dir, "app.ts", "");
    const result = findUnusedKeys(envFile, [srcFile]);
    expect(result.totalKeys).toBe(3);
    expect(result.unusedKeys).toHaveLength(3);
  });
});
