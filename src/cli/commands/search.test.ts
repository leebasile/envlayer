import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { searchEnvFiles, parseEnvFile } from "./search";
import { formatSearchText, formatSearchJson, formatSearchSummary } from "./search.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-search-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs with line numbers", () => {
    const entries = parseEnvFile("FOO=bar\nBAZ=qux\n");
    expect(entries.get("FOO")).toEqual({ value: "bar", line: 1 });
    expect(entries.get("BAZ")).toEqual({ value: "qux", line: 2 });
  });

  it("skips comments and blank lines", () => {
    const entries = parseEnvFile("# comment\n\nKEY=val");
    expect(entries.size).toBe(1);
    expect(entries.get("KEY")).toEqual({ value: "val", line: 3 });
  });
});

describe("searchEnvFiles", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it("finds matches in keys", () => {
    const f = writeFile(tmpDir, ".env", "DATABASE_URL=postgres://localhost\nAPI_KEY=secret\n");
    const results = searchEnvFiles([f], "database", true, false);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe("DATABASE_URL");
  });

  it("finds matches in values", () => {
    const f = writeFile(tmpDir, ".env", "HOST=localhost\nDB=postgres://localhost\n");
    const results = searchEnvFiles([f], "localhost", false, true);
    expect(results).toHaveLength(2);
  });

  it("returns empty array when no matches", () => {
    const f = writeFile(tmpDir, ".env", "FOO=bar\n");
    const results = searchEnvFiles([f], "nonexistent", true, true);
    expect(results).toHaveLength(0);
  });

  it("searches across multiple files", () => {
    const f1 = writeFile(tmpDir, ".env.dev", "SECRET=abc\n");
    const f2 = writeFile(tmpDir, ".env.prod", "SECRET=xyz\n");
    const results = searchEnvFiles([f1, f2], "SECRET", true, false);
    expect(results).toHaveLength(2);
  });
});

describe("formatters", () => {
  const sample = [{ file: "/app/.env", key: "FOO", value: "bar", lineNumber: 1 }];

  it("formatSearchText returns readable output", () => {
    const out = formatSearchText(sample);
    expect(out).toContain("FOO=bar");
    expect(out).toContain("1 match");
  });

  it("formatSearchText handles empty results", () => {
    expect(formatSearchText([])).toBe("No matches found.");
  });

  it("formatSearchJson returns valid JSON", () => {
    const json = JSON.parse(formatSearchJson(sample));
    expect(json[0].key).toBe("FOO");
  });

  it("formatSearchSummary summarizes correctly", () => {
    const summary = formatSearchSummary(sample);
    expect(summary).toContain("1 match");
    expect(summary).toContain("1 file");
  });
});
