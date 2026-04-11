import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { findUniqueKeys, parseEnvFile } from "./unique";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-unique-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const map = parseEnvFile(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nKEY=val\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("val");
  });
});

describe("findUniqueKeys", () => {
  it("identifies keys unique to each file", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, "a.env", "SHARED=1\nONLY_A=2\n");
    const b = writeFile(dir, "b.env", "SHARED=1\nONLY_B=3\n");

    const results = findUniqueKeys([a, b]);
    const resA = results.find((r) => r.file === a)!;
    const resB = results.find((r) => r.file === b)!;

    expect(resA.uniqueKeys).toEqual(["ONLY_A"]);
    expect(resB.uniqueKeys).toEqual(["ONLY_B"]);
  });

  it("returns empty unique list when all keys are shared", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, "a.env", "KEY=1\n");
    const b = writeFile(dir, "b.env", "KEY=2\n");

    const results = findUniqueKeys([a, b]);
    expect(results[0].uniqueKeys).toHaveLength(0);
    expect(results[1].uniqueKeys).toHaveLength(0);
  });

  it("handles three files correctly", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, "a.env", "A=1\nSHARED=x\n");
    const b = writeFile(dir, "b.env", "B=2\nSHARED=x\n");
    const c = writeFile(dir, "c.env", "C=3\nSHARED=x\n");

    const results = findUniqueKeys([a, b, c]);
    expect(results.find((r) => r.file === a)!.uniqueKeys).toEqual(["A"]);
    expect(results.find((r) => r.file === b)!.uniqueKeys).toEqual(["B"]);
    expect(results.find((r) => r.file === c)!.uniqueKeys).toEqual(["C"]);
  });

  it("returns all keys as unique when files have no overlap", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, "a.env", "ALPHA=1\n");
    const b = writeFile(dir, "b.env", "BETA=2\n");

    const results = findUniqueKeys([a, b]);
    expect(results.find((r) => r.file === a)!.uniqueKeys).toEqual(["ALPHA"]);
    expect(results.find((r) => r.file === b)!.uniqueKeys).toEqual(["BETA"]);
  });
});
