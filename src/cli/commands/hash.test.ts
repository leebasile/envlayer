import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { hashEnvFile, parseEnvFile } from "./hash";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-hash-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key-value pairs", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const result = parseEnvFile(file);
    expect(result.get("FOO")).toBe("bar");
    expect(result.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nKEY=value\n");
    const result = parseEnvFile(file);
    expect(result.size).toBe(1);
    expect(result.get("KEY")).toBe("value");
  });
});

describe("hashEnvFile", () => {
  it("returns hashes for all keys by default", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "API_KEY=secret\nDB_PASS=hunter2\n");
    const result = hashEnvFile(file, "sha256");
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].key).toBe("API_KEY");
    expect(result.entries[0].hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.fileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("filters to specified keys only", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=1\nB=2\nC=3\n");
    const result = hashEnvFile(file, "sha256", ["A", "C"]);
    expect(result.entries).toHaveLength(2);
    expect(result.entries.map((e) => e.key)).toEqual(["A", "C"]);
  });

  it("uses md5 algorithm when specified", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "TOKEN=abc123\n");
    const result = hashEnvFile(file, "md5");
    expect(result.algorithm).toBe("md5");
    expect(result.entries[0].hash).toMatch(/^[a-f0-9]{32}$/);
  });

  it("produces consistent hashes for same values", () => {
    const dir = makeTmpDir();
    const file1 = writeFile(dir, ".env1", "SECRET=myvalue\n");
    const file2 = writeFile(dir, ".env2", "SECRET=myvalue\n");
    const r1 = hashEnvFile(file1, "sha256");
    const r2 = hashEnvFile(file2, "sha256");
    expect(r1.entries[0].hash).toBe(r2.entries[0].hash);
  });

  it("returns different hashes for different values", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "KEY=value1\n");
    const file2 = writeFile(dir, ".env2", "KEY=value2\n");
    const r1 = hashEnvFile(file, "sha256");
    const r2 = hashEnvFile(file2, "sha256");
    expect(r1.entries[0].hash).not.toBe(r2.entries[0].hash);
  });
});
