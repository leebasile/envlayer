import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach } from "vitest";
import { normalizeEnvFile, parseEnvFile, serializeEnvMap } from "./normalize";
import { formatNormalizeText, formatNormalizeJson, formatNormalizeSummary } from "./normalize.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-normalize-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("normalizeEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it("trims quoted values when --trim is set", () => {
    const file = writeFile(tmpDir, ".env", `KEY='  hello  '\nOTHER=world\n`);
    const result = normalizeEnvFile(file, { trimValues: true });
    expect(result.normalized.get("KEY")).toBe("hello");
    expect(result.normalized.get("OTHER")).toBe("world");
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].key).toBe("KEY");
  });

  it("removes empty values when --remove-empty is set", () => {
    const file = writeFile(tmpDir, ".env", `PRESENT=value\nEMPTY=\n`);
    const result = normalizeEnvFile(file, { removeEmpty: true });
    expect(result.normalized.has("EMPTY")).toBe(false);
    expect(result.normalized.has("PRESENT")).toBe(true);
    expect(result.changes[0].to).toBe("<removed>");
  });

  it("quotes values with spaces when --quote is set", () => {
    const file = writeFile(tmpDir, ".env", `GREETING=hello world\nSIMPLE=ok\n`);
    const result = normalizeEnvFile(file, { quoteValues: true });
    expect(result.normalized.get("GREETING")).toBe('"hello world"');
    expect(result.normalized.get("SIMPLE")).toBe("ok");
    expect(result.changes).toHaveLength(1);
  });

  it("returns no changes when file is already normalized", () => {
    const file = writeFile(tmpDir, ".env", `KEY=value\nFOO=bar\n`);
    const result = normalizeEnvFile(file, { trimValues: true, quoteValues: true, removeEmpty: true });
    expect(result.changes).toHaveLength(0);
  });
});

describe("formatNormalizeText", () => {
  it("shows no changes message when empty", () => {
    const result = { original: new Map(), normalized: new Map(), changes: [] };
    expect(formatNormalizeText(result, false)).toContain("No changes needed");
  });

  it("lists modified and removed keys", () => {
    const changes = [
      { key: "A", from: "old", to: "new" },
      { key: "B", from: "", to: "<removed>" },
    ];
    const result = { original: new Map(), normalized: new Map(), changes };
    const text = formatNormalizeText(result, true);
    expect(text).toContain("~ A");
    expect(text).toContain("- B");
    expect(text).toContain("dry run");
  });
});

describe("formatNormalizeSummary", () => {
  it("returns summary with counts", () => {
    const changes = [
      { key: "A", from: "x", to: "y" },
      { key: "B", from: "", to: "<removed>" },
    ];
    const result = { original: new Map(), normalized: new Map(), changes };
    const summary = formatNormalizeSummary(result);
    expect(summary).toContain("1 modified");
    expect(summary).toContain("1 removed");
  });
});
