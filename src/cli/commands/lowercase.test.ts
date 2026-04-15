import fs from "fs";
import os from "os";
import path from "path";
import { lowercaseEnvKeys, parseEnvFile, serializeEnvMap } from "./lowercase";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-lowercase-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("lowercaseEnvKeys", () => {
  it("converts uppercase keys to lowercase", () => {
    const dir = makeTmpDir();
    const input = writeFile(dir, ".env", "API_KEY=abc123\nDB_HOST=localhost\n");
    const output = path.join(dir, ".env.out");
    const result = lowercaseEnvKeys(input, output);
    expect(result.renamed).toHaveLength(2);
    expect(result.renamed[0]).toEqual({ from: "API_KEY", to: "api_key" });
    expect(result.renamed[1]).toEqual({ from: "DB_HOST", to: "db_host" });
    expect(result.skipped).toHaveLength(0);
    const written = fs.readFileSync(output, "utf-8");
    expect(written).toContain("api_key=abc123");
    expect(written).toContain("db_host=localhost");
  });

  it("skips keys that are already lowercase", () => {
    const dir = makeTmpDir();
    const input = writeFile(dir, ".env", "already_lower=value\nANOTHER=val\n");
    const output = path.join(dir, ".env.out");
    const result = lowercaseEnvKeys(input, output);
    expect(result.skipped).toContain("already_lower");
    expect(result.renamed).toHaveLength(1);
    expect(result.renamed[0]).toEqual({ from: "ANOTHER", to: "another" });
  });

  it("writes output to the same file when no out option is given", () => {
    const dir = makeTmpDir();
    const input = writeFile(dir, ".env", "FOO=bar\n");
    lowercaseEnvKeys(input, input);
    const content = fs.readFileSync(input, "utf-8");
    expect(content).toContain("foo=bar");
    expect(content).not.toContain("FOO=bar");
  });

  it("handles mixed-case keys correctly", () => {
    const dir = makeTmpDir();
    const input = writeFile(dir, ".env", "MyKey=value1\nANOTHER_Key=value2\n");
    const output = path.join(dir, ".env.out");
    const result = lowercaseEnvKeys(input, output);
    expect(result.renamed.map((r) => r.to)).toEqual(["mykey", "another_key"]);
  });

  it("returns empty renamed array when all keys are already lowercase", () => {
    const dir = makeTmpDir();
    const input = writeFile(dir, ".env", "foo=1\nbar=2\n");
    const output = path.join(dir, ".env.out");
    const result = lowercaseEnvKeys(input, output);
    expect(result.renamed).toHaveLength(0);
    expect(result.skipped).toEqual(["foo", "bar"]);
  });
});
