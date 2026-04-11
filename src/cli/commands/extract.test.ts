import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseEnvFile, extractEnvKeys, serializeEnvMap } from "./extract";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-extract-"));
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

  it("strips surrounding quotes from values", () => {
    const map = parseEnvFile('QUOTED="hello world"\n');
    expect(map.get("QUOTED")).toBe("hello world");
  });
});

describe("extractEnvKeys", () => {
  const map = new Map([
    ["A", "1"],
    ["B", "2"],
    ["C", "3"],
  ]);

  it("extracts specified keys", () => {
    const { extracted, missing } = extractEnvKeys(map, ["A", "C"]);
    expect(extracted.size).toBe(2);
    expect(extracted.get("A")).toBe("1");
    expect(extracted.get("C")).toBe("3");
    expect(missing).toHaveLength(0);
  });

  it("reports missing keys", () => {
    const { extracted, missing } = extractEnvKeys(map, ["A", "Z"]);
    expect(extracted.size).toBe(1);
    expect(missing).toEqual(["Z"]);
  });

  it("returns empty map when no keys match", () => {
    const { extracted, missing } = extractEnvKeys(map, ["X", "Y"]);
    expect(extracted.size).toBe(0);
    expect(missing).toEqual(["X", "Y"]);
  });
});

describe("serializeEnvMap", () => {
  it("serializes map to env format", () => {
    const map = new Map([["FOO", "bar"]]);
    expect(serializeEnvMap(map)).toBe("FOO=bar\n");
  });
});

describe("extract integration", () => {
  it("writes extracted keys to output file", () => {
    const dir = makeTmpDir();
    const inputPath = writeFile(dir, ".env", "FOO=1\nBAR=2\nBAZ=3\n");
    const outputPath = path.join(dir, ".env.extracted");
    const map = parseEnvFile(fs.readFileSync(inputPath, "utf-8"));
    const { extracted } = extractEnvKeys(map, ["FOO", "BAZ"]);
    fs.writeFileSync(outputPath, serializeEnvMap(extracted), "utf-8");
    const result = fs.readFileSync(outputPath, "utf-8");
    expect(result).toContain("FOO=1");
    expect(result).toContain("BAZ=3");
    expect(result).not.toContain("BAR");
  });
});
