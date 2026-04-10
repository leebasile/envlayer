import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { sortEnvFile, parseEnvFile } from "./sort";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-sort-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("sortEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("sorts keys in ascending order by default", () => {
    const filePath = writeFile(tmpDir, ".env", "ZEBRA=1\nAPPLE=2\nMANGO=3\n");
    const { keyCount } = sortEnvFile(filePath);
    expect(keyCount).toBe(3);
    const result = fs.readFileSync(filePath, "utf-8");
    const keys = result.trim().split("\n").map((l) => l.split("=")[0]);
    expect(keys).toEqual(["APPLE", "MANGO", "ZEBRA"]);
  });

  it("sorts keys in descending order when specified", () => {
    const filePath = writeFile(tmpDir, ".env", "ZEBRA=1\nAPPLE=2\nMANGO=3\n");
    sortEnvFile(filePath, "desc");
    const result = fs.readFileSync(filePath, "utf-8");
    const keys = result.trim().split("\n").map((l) => l.split("=")[0]);
    expect(keys).toEqual(["ZEBRA", "MANGO", "APPLE"]);
  });

  it("returns correct keyCount", () => {
    const filePath = writeFile(tmpDir, ".env", "B=2\nA=1\n");
    const { keyCount } = sortEnvFile(filePath);
    expect(keyCount).toBe(2);
  });

  it("throws if file does not exist", () => {
    expect(() => sortEnvFile(path.join(tmpDir, "missing.env"))).toThrow(
      "File not found"
    );
  });

  it("ignores comments and blank lines", () => {
    const filePath = writeFile(
      tmpDir,
      ".env",
      "# comment\n\nZEBRA=1\nAPPLE=2\n"
    );
    sortEnvFile(filePath);
    const result = fs.readFileSync(filePath, "utf-8");
    const keys = result.trim().split("\n").map((l) => l.split("=")[0]);
    expect(keys).toEqual(["APPLE", "ZEBRA"]);
  });

  it("handles already-sorted file without changes to values", () => {
    const filePath = writeFile(tmpDir, ".env", "ALPHA=hello\nBETA=world\n");
    sortEnvFile(filePath);
    const map = parseEnvFile(fs.readFileSync(filePath, "utf-8"));
    expect(map.get("ALPHA")).toBe("hello");
    expect(map.get("BETA")).toBe("world");
  });
});
