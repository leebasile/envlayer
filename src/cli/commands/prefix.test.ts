import fs from "fs";
import os from "os";
import path from "path";
import { prefixEnvKeys, parseEnvFile, serializeEnvMap } from "./prefix";
import { formatPrefixText, formatPrefixJson, formatPrefixSummary } from "./prefix.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-prefix-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe("prefixEnvKeys", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it("adds prefix to keys that do not already have it", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const result = prefixEnvKeys(file, "APP_");
    expect(result.renamedKeys).toEqual(["APP_FOO", "APP_BAZ"]);
    expect(result.keysRenamed).toBe(2);
  });

  it("does not double-prefix keys that already have the prefix", () => {
    const file = writeFile(tmpDir, ".env", "APP_FOO=bar\nBAZ=qux\n");
    const result = prefixEnvKeys(file, "APP_");
    expect(result.renamedKeys).toContain("APP_FOO");
    expect(result.renamedKeys).toContain("APP_BAZ");
    expect(result.keysRenamed).toBe(1);
  });

  it("strips prefix from keys when strip=true", () => {
    const file = writeFile(tmpDir, ".env", "APP_FOO=bar\nAPP_BAZ=qux\n");
    const result = prefixEnvKeys(file, "APP_", true);
    expect(result.renamedKeys).toEqual(["FOO", "BAZ"]);
    expect(result.keysRenamed).toBe(2);
  });

  it("returns empty result for empty file", () => {
    const file = writeFile(tmpDir, ".env", "");
    const result = prefixEnvKeys(file, "APP_");
    expect(result.keysRenamed).toBe(0);
    expect(result.originalKeys).toHaveLength(0);
  });
});

describe("formatPrefixText", () => {
  it("includes file, prefix, and renamed count", () => {
    const result = { file: ".env", prefix: "APP_", keysRenamed: 2, originalKeys: ["FOO", "BAZ"], renamedKeys: ["APP_FOO", "APP_BAZ"] };
    const text = formatPrefixText(result);
    expect(text).toContain("APP_");
    expect(text).toContain("Keys renamed: 2");
    expect(text).toContain("FOO → APP_FOO");
  });

  it("includes dry-run notice when dryRun=true", () => {
    const result = { file: ".env", prefix: "X_", keysRenamed: 0, originalKeys: [], renamedKeys: [] };
    const text = formatPrefixText(result, true);
    expect(text).toContain("dry-run");
  });
});

describe("formatPrefixJson", () => {
  it("returns valid JSON with dryRun field", () => {
    const result = { file: ".env", prefix: "APP_", keysRenamed: 1, originalKeys: ["FOO"], renamedKeys: ["APP_FOO"] };
    const json = JSON.parse(formatPrefixJson(result, true));
    expect(json.dryRun).toBe(true);
    expect(json.keysRenamed).toBe(1);
  });
});

describe("formatPrefixSummary", () => {
  it("returns a brief summary string", () => {
    const result = { file: ".env", prefix: "APP_", keysRenamed: 3, originalKeys: [], renamedKeys: [] };
    const summary = formatPrefixSummary(result);
    expect(summary).toContain("3 key(s)");
    expect(summary).toContain("APP_");
  });
});
