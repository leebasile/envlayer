import fs from "fs";
import os from "os";
import path from "path";
import { swapEnvKeys, parseEnvFile, serializeEnvMap } from "./swap";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-swap-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("swapEnvKeys", () => {
  it("swaps values of two existing keys", () => {
    const map = new Map([
      ["FOO", "hello"],
      ["BAR", "world"],
      ["BAZ", "other"],
    ]);
    const { map: result, swapped } = swapEnvKeys(map, "FOO", "BAR");
    expect(swapped).toBe(true);
    expect(result.get("FOO")).toBe("world");
    expect(result.get("BAR")).toBe("hello");
    expect(result.get("BAZ")).toBe("other");
  });

  it("returns swapped=false when keyA is missing", () => {
    const map = new Map([["BAR", "world"]]);
    const { swapped } = swapEnvKeys(map, "FOO", "BAR");
    expect(swapped).toBe(false);
  });

  it("returns swapped=false when keyB is missing", () => {
    const map = new Map([["FOO", "hello"]]);
    const { swapped } = swapEnvKeys(map, "FOO", "BAR");
    expect(swapped).toBe(false);
  });

  it("returns swapped=false when both keys are missing", () => {
    const map = new Map([["OTHER", "value"]]);
    const { swapped } = swapEnvKeys(map, "FOO", "BAR");
    expect(swapped).toBe(false);
  });

  it("preserves insertion order of keys after swap", () => {
    const map = new Map([
      ["A", "1"],
      ["B", "2"],
      ["C", "3"],
    ]);
    const { map: result } = swapEnvKeys(map, "A", "C");
    const keys = Array.from(result.keys());
    expect(keys).toEqual(["A", "B", "C"]);
    expect(result.get("A")).toBe("3");
    expect(result.get("C")).toBe("1");
  });
});

describe("parseEnvFile + serializeEnvMap roundtrip", () => {
  it("writes and reads back swapped values correctly", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "FOO=alpha\nBAR=beta\nBAZ=gamma\n");
    const map = parseEnvFile(filePath);
    const { map: updated } = swapEnvKeys(map, "FOO", "BAR");
    fs.writeFileSync(filePath, serializeEnvMap(updated), "utf-8");
    const reloaded = parseEnvFile(filePath);
    expect(reloaded.get("FOO")).toBe("beta");
    expect(reloaded.get("BAR")).toBe("alpha");
    expect(reloaded.get("BAZ")).toBe("gamma");
  });
});
