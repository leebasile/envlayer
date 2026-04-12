import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { generateEnvFile, parseEnvFile } from "./generate";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-generate-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("generateEnvFile", () => {
  it("creates a new file with empty values for given keys", () => {
    const dir = makeTmpDir();
    const out = path.join(dir, ".env");
    const { written, skipped } = generateEnvFile(["FOO", "BAR"], out, false);
    expect(written).toEqual(["FOO", "BAR"]);
    expect(skipped).toEqual([]);
    const map = parseEnvFile(out);
    expect(map.get("FOO")).toBe("");
    expect(map.get("BAR")).toBe("");
  });

  it("skips existing keys when overwrite is false", () => {
    const dir = makeTmpDir();
    const out = writeFile(dir, ".env", "FOO=existing\n");
    const { written, skipped } = generateEnvFile(["FOO", "BAR"], out, false);
    expect(written).toEqual(["BAR"]);
    expect(skipped).toEqual(["FOO"]);
    const map = parseEnvFile(out);
    expect(map.get("FOO")).toBe("existing");
    expect(map.get("BAR")).toBe("");
  });

  it("overwrites existing keys when overwrite is true", () => {
    const dir = makeTmpDir();
    const out = writeFile(dir, ".env", "FOO=existing\n");
    const { written, skipped } = generateEnvFile(["FOO", "BAR"], out, true);
    expect(written).toEqual(["FOO", "BAR"]);
    expect(skipped).toEqual([]);
    const map = parseEnvFile(out);
    expect(map.get("FOO")).toBe("");
    expect(map.get("BAR")).toBe("");
  });

  it("creates nested directories if needed", () => {
    const dir = makeTmpDir();
    const out = path.join(dir, "nested", "deep", ".env");
    generateEnvFile(["KEY"], out, false);
    expect(fs.existsSync(out)).toBe(true);
    const map = parseEnvFile(out);
    expect(map.get("KEY")).toBe("");
  });

  it("handles empty keys array gracefully", () => {
    const dir = makeTmpDir();
    const out = path.join(dir, ".env");
    const { written, skipped } = generateEnvFile([], out, false);
    expect(written).toEqual([]);
    expect(skipped).toEqual([]);
    expect(fs.existsSync(out)).toBe(true);
  });
});
