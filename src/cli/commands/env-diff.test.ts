import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { envDiff, parseEnvFile } from "./env-diff";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-env-diff-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("envDiff", () => {
  it("detects added keys", () => {
    const base = new Map([["A", "1"]]);
    const target = new Map([["A", "1"], ["B", "2"]]);
    const result = envDiff(base, target);
    expect(result.added).toEqual({ B: "2" });
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
    expect(result.unchanged).toContain("A");
  });

  it("detects removed keys", () => {
    const base = new Map([["A", "1"], ["B", "2"]]);
    const target = new Map([["A", "1"]]);
    const result = envDiff(base, target);
    expect(result.removed).toEqual({ B: "2" });
    expect(result.added).toEqual({});
  });

  it("detects changed keys", () => {
    const base = new Map([["A", "old"]]);
    const target = new Map([["A", "new"]]);
    const result = envDiff(base, target);
    expect(result.changed).toEqual({ A: { from: "old", to: "new" } });
  });

  it("reports unchanged keys", () => {
    const base = new Map([["X", "same"]]);
    const target = new Map([["X", "same"]]);
    const result = envDiff(base, target);
    expect(result.unchanged).toEqual(["X"]);
    expect(result.added).toEqual({});
    expect(result.removed).toEqual({});
    expect(result.changed).toEqual({});
  });
});

describe("parseEnvFile for env-diff", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("parses a basic .env file", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const map = parseEnvFile(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const file = writeFile(tmpDir, ".env", "# comment\n\nKEY=val\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("val");
  });

  it("strips surrounding quotes from values", () => {
    const file = writeFile(tmpDir, ".env", 'QUOTED="hello world"\n');
    const map = parseEnvFile(file);
    expect(map.get("QUOTED")).toBe("hello world");
  });
});
