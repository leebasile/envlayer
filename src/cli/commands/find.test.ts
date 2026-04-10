import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { findEnvKey, parseEnvFile } from "./find";
import { formatFindText, formatFindSummary } from "./find.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-find-"));
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
    const map = parseEnvFile("# comment\n\nKEY=val\n");
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("val");
  });
});

describe("findEnvKey", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds keys matching a pattern", () => {
    const file = writeFile(tmpDir, ".env", "DB_HOST=localhost\nDB_PORT=5432\nAPI_KEY=secret\n");
    const results = findEnvKey([file], "^DB_", false);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toEqual(["DB_HOST", "DB_PORT"]);
  });

  it("finds matches in values when valueSearch is true", () => {
    const file = writeFile(tmpDir, ".env", "HOST=localhost\nURL=https://localhost:3000\nKEY=abc\n");
    const results = findEnvKey([file], "localhost", true);
    expect(results).toHaveLength(2);
  });

  it("returns empty array when no matches", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\n");
    const results = findEnvKey([file], "NONEXISTENT", false);
    expect(results).toHaveLength(0);
  });

  it("skips missing files gracefully", () => {
    const results = findEnvKey(["/nonexistent/.env"], "FOO", false);
    expect(results).toHaveLength(0);
  });
});

describe("formatFindText", () => {
  it("returns no-match message for empty results", () => {
    expect(formatFindText([])).toBe("No matches found.");
  });

  it("groups results by file", () => {
    const output = formatFindText([
      { key: "FOO", value: "bar", file: "/a/.env" },
      { key: "BAZ", value: "qux", file: "/a/.env" },
    ]);
    expect(output).toContain("File: /a/.env");
    expect(output).toContain("FOO=bar");
  });
});

describe("formatFindSummary", () => {
  it("summarises match count and file count", () => {
    const summary = formatFindSummary([
      { key: "A", value: "1", file: "/a/.env" },
      { key: "B", value: "2", file: "/b/.env" },
    ]);
    expect(summary).toBe("Found 2 match(es) across 2 file(s).");
  });
});
