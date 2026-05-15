import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { freezeEnvFile, getFrozenKeys, parseEnvFile, serializeEnvMap } from "./freeze";

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-freeze-"));
}

function writeFile(dir: string, name: string, content: string) {
  const fp = path.join(dir, name);
  fs.writeFileSync(fp, content, "utf-8");
  return fp;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const map = parseEnvFile("A=1\nB=2\n");
    expect(map.get("A")).toBe("1");
    expect(map.get("B")).toBe("2");
  });

  it("ignores comments", () => {
    const map = parseEnvFile("# comment\nA=1\n");
    expect(map.size).toBe(1);
  });
});

describe("getFrozenKeys", () => {
  it("detects frozen markers", () => {
    const content = "API_KEY=abc # frozen\nDB_PASS=xyz\n";
    const frozen = getFrozenKeys(content);
    expect(frozen.has("API_KEY")).toBe(true);
    expect(frozen.has("DB_PASS")).toBe(false);
  });
});

describe("serializeEnvMap", () => {
  it("appends frozen comment to frozen keys", () => {
    const map = new Map([["A", "1"], ["B", "2"]]);
    const out = serializeEnvMap(map, new Set(["A"]));
    expect(out).toContain("A=1 # frozen");
    expect(out).toContain("B=2");
    expect(out).not.toMatch(/B=2 # frozen/);
  });
});

describe("freezeEnvFile", () => {
  it("freezes specified keys", () => {
    const dir = makeTmpDir();
    const fp = writeFile(dir, ".env", "API_KEY=abc\nDB_PASS=xyz\n");
    const result = freezeEnvFile(fp, { keys: ["API_KEY"] });
    expect(result.frozen).toHaveLength(1);
    expect(result.frozen[0].key).toBe("API_KEY");
    const written = fs.readFileSync(fp, "utf-8");
    expect(written).toContain("API_KEY=abc # frozen");
  });

  it("unfreezes specified keys", () => {
    const dir = makeTmpDir();
    const fp = writeFile(dir, ".env", "API_KEY=abc # frozen\nDB_PASS=xyz\n");
    const result = freezeEnvFile(fp, { keys: ["API_KEY"], unfreeze: true });
    expect(result.unfrozen).toHaveLength(1);
    const written = fs.readFileSync(fp, "utf-8");
    expect(written).not.toContain("# frozen");
  });

  it("skips missing keys", () => {
    const dir = makeTmpDir();
    const fp = writeFile(dir, ".env", "A=1\n");
    const result = freezeEnvFile(fp, { keys: ["MISSING"] });
    expect(result.skipped).toContain("MISSING");
  });

  it("freezes all keys with --all", () => {
    const dir = makeTmpDir();
    const fp = writeFile(dir, ".env", "X=1\nY=2\n");
    const result = freezeEnvFile(fp, { all: true });
    expect(result.frozen).toHaveLength(2);
  });
});
