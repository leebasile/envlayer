import fs from "fs";
import os from "os";
import path from "path";
import { analyzeSchema, parseEnvFile } from "./schema";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-schema-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key-value pairs", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\nBAZ=123\n");
    const map = parseEnvFile(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("123");
  });

  it("skips comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nKEY=value\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("value");
  });
});

describe("analyzeSchema", () => {
  it("detects string type", () => {
    const map = new Map([["NAME", "alice"]]);
    const result = analyzeSchema(map);
    expect(result[0].type).toBe("string");
    expect(result[0].key).toBe("NAME");
  });

  it("detects number type", () => {
    const map = new Map([["PORT", "3000"]]);
    const result = analyzeSchema(map);
    expect(result[0].type).toBe("number");
  });

  it("detects boolean type", () => {
    const map = new Map([["DEBUG", "true"]]);
    const result = analyzeSchema(map);
    expect(result[0].type).toBe("boolean");
  });

  it("marks all entries as required by default", () => {
    const map = new Map([["API_KEY", "abc123"]]);
    const result = analyzeSchema(map);
    expect(result[0].required).toBe(true);
  });

  it("returns empty array for empty map", () => {
    const result = analyzeSchema(new Map());
    expect(result).toHaveLength(0);
  });

  it("includes example value when present", () => {
    const map = new Map([["HOST", "localhost"]]);
    const result = analyzeSchema(map);
    expect(result[0].example).toBe("localhost");
  });
});
