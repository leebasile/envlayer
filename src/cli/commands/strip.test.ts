import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { stripEnvFile, parseEnvFile } from "./strip";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-strip-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("stripEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("removes a single key from the env file", () => {
    const filePath = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const { stripped } = stripEnvFile(filePath, ["FOO"]);
    expect(stripped).toEqual(["FOO"]);
    const map = parseEnvFile(filePath);
    expect(map.has("FOO")).toBe(false);
    expect(map.get("BAZ")).toBe("qux");
  });

  it("removes multiple keys from the env file", () => {
    const filePath = writeFile(tmpDir, ".env", "A=1\nB=2\nC=3\n");
    const { stripped } = stripEnvFile(filePath, ["A", "C"]);
    expect(stripped).toEqual(["A", "C"]);
    const map = parseEnvFile(filePath);
    expect(map.has("A")).toBe(false);
    expect(map.has("C")).toBe(false);
    expect(map.get("B")).toBe("2");
  });

  it("returns empty stripped array when no keys match", () => {
    const filePath = writeFile(tmpDir, ".env", "X=hello\n");
    const { stripped } = stripEnvFile(filePath, ["MISSING"]);
    expect(stripped).toEqual([]);
    const map = parseEnvFile(filePath);
    expect(map.get("X")).toBe("hello");
  });

  it("handles an empty env file gracefully", () => {
    const filePath = writeFile(tmpDir, ".env", "");
    const { stripped } = stripEnvFile(filePath, ["FOO"]);
    expect(stripped).toEqual([]);
  });

  it("ignores comment lines and blank lines during parsing", () => {
    const filePath = writeFile(tmpDir, ".env", "# comment\nKEY=value\n\nOTHER=123\n");
    const { stripped } = stripEnvFile(filePath, ["KEY"]);
    expect(stripped).toEqual(["KEY"]);
    const map = parseEnvFile(filePath);
    expect(map.has("KEY")).toBe(false);
    expect(map.get("OTHER")).toBe("123");
  });

  it("returns the resolved output path", () => {
    const filePath = writeFile(tmpDir, ".env", "Z=99\n");
    const { outputPath } = stripEnvFile(filePath, ["Z"]);
    expect(path.isAbsolute(outputPath)).toBe(true);
  });
});
