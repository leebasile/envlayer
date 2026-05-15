import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach } from "vitest";
import { timestampEnvFile, parseEnvFile } from "./timestamp";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-timestamp-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("timestampEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it("adds ISO timestamp keys for all keys when none specified", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const result = timestampEnvFile(file, [], "iso");
    expect(result.count).toBe(2);
    const map = parseEnvFile(file);
    expect(map.has("FOO_TIMESTAMP")).toBe(true);
    expect(map.has("BAZ_TIMESTAMP")).toBe(true);
    expect(map.get("FOO_TIMESTAMP")).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it("adds timestamp only for specified keys", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const result = timestampEnvFile(file, ["FOO"], "iso");
    expect(result.count).toBe(1);
    const map = parseEnvFile(file);
    expect(map.has("FOO_TIMESTAMP")).toBe(true);
    expect(map.has("BAZ_TIMESTAMP")).toBe(false);
  });

  it("uses unix format when specified", () => {
    const file = writeFile(tmpDir, ".env", "TOKEN=abc\n");
    timestampEnvFile(file, ["TOKEN"], "unix");
    const map = parseEnvFile(file);
    const ts = map.get("TOKEN_TIMESTAMP");
    expect(ts).toMatch(/^\d+$/);
    expect(Number(ts)).toBeGreaterThan(1_000_000_000);
  });

  it("uses utc format when specified", () => {
    const file = writeFile(tmpDir, ".env", "KEY=val\n");
    timestampEnvFile(file, ["KEY"], "utc");
    const map = parseEnvFile(file);
    expect(map.get("KEY_TIMESTAMP")).toMatch(/GMT/);
  });

  it("skips keys not present in file", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\n");
    const result = timestampEnvFile(file, ["MISSING"], "iso");
    expect(result.count).toBe(0);
    const map = parseEnvFile(file);
    expect(map.has("MISSING_TIMESTAMP")).toBe(false);
  });

  it("returns correct file name in result", () => {
    const file = writeFile(tmpDir, "staging.env", "A=1\n");
    const result = timestampEnvFile(file, ["A"], "iso");
    expect(result.file).toBe("staging.env");
  });

  it("preserves existing keys after writing", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    timestampEnvFile(file, ["FOO"], "iso");
    const map = parseEnvFile(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });
});
