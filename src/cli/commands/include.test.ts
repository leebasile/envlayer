import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { includeEnvKeys, parseEnvFile, serializeEnvMap } from "./include";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-include-"));
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
    const file = writeFile(dir, ".env", "# comment\n\nFOO=bar\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("FOO")).toBe("bar");
  });
});

describe("includeEnvKeys", () => {
  it("includes specified keys from source into base", () => {
    const base = new Map([["EXISTING", "yes"]]);
    const source = new Map([["FOO", "bar"], ["BAZ", "qux"]]);
    const { result, included, missing } = includeEnvKeys(base, source, ["FOO"]);
    expect(result.get("FOO")).toBe("bar");
    expect(result.get("EXISTING")).toBe("yes");
    expect(included).toEqual(["FOO"]);
    expect(missing).toEqual([]);
  });

  it("reports missing keys not in source", () => {
    const base = new Map<string, string>();
    const source = new Map([["FOO", "bar"]]);
    const { included, missing } = includeEnvKeys(base, source, ["FOO", "MISSING"]);
    expect(included).toEqual(["FOO"]);
    expect(missing).toEqual(["MISSING"]);
  });

  it("does not mutate the original base map", () => {
    const base = new Map([["A", "1"]]);
    const source = new Map([["B", "2"]]);
    const { result } = includeEnvKeys(base, source, ["B"]);
    expect(base.has("B")).toBe(false);
    expect(result.has("B")).toBe(true);
  });

  it("returns empty included and all missing when source is empty", () => {
    const base = new Map<string, string>();
    const source = new Map<string, string>();
    const { included, missing } = includeEnvKeys(base, source, ["X", "Y"]);
    expect(included).toEqual([]);
    expect(missing).toEqual(["X", "Y"]);
  });
});

describe("serializeEnvMap", () => {
  it("serializes map to env format", () => {
    const map = new Map([["FOO", "bar"], ["BAZ", "qux"]]);
    const out = serializeEnvMap(map);
    expect(out).toContain("FOO=bar");
    expect(out).toContain("BAZ=qux");
  });
});
