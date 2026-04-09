import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { deleteEnvKey, parseEnvFile, serializeEnvMap } from "./delete";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-delete-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("deleteEnvKey", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("deletes an existing key from the env file", () => {
    const filePath = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const result = deleteEnvKey(filePath, "FOO");
    expect(result.found).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    const map = parseEnvFile(content);
    expect(map.has("FOO")).toBe(false);
    expect(map.get("BAZ")).toBe("qux");
  });

  it("returns found: false when key does not exist", () => {
    const filePath = writeFile(tmpDir, ".env", "FOO=bar\n");
    const result = deleteEnvKey(filePath, "MISSING");
    expect(result.found).toBe(false);
    const content = fs.readFileSync(filePath, "utf-8");
    const map = parseEnvFile(content);
    expect(map.get("FOO")).toBe("bar");
  });

  it("throws when the file does not exist", () => {
    expect(() => deleteEnvKey(path.join(tmpDir, "nonexistent.env"), "FOO")).toThrow(
      "File not found"
    );
  });

  it("preserves remaining keys after deletion", () => {
    const filePath = writeFile(tmpDir, ".env", "A=1\nB=2\nC=3\n");
    deleteEnvKey(filePath, "B");
    const content = fs.readFileSync(filePath, "utf-8");
    const map = parseEnvFile(content);
    expect(map.has("B")).toBe(false);
    expect(map.get("A")).toBe("1");
    expect(map.get("C")).toBe("3");
  });

  it("ignores comment lines and blank lines", () => {
    const filePath = writeFile(tmpDir, ".env", "# comment\nFOO=bar\n\nBAZ=qux\n");
    const result = deleteEnvKey(filePath, "FOO");
    expect(result.found).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    const map = parseEnvFile(content);
    expect(map.has("FOO")).toBe(false);
  });
});
