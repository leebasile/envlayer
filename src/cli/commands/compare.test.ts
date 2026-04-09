import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { compareEnvFiles, parseEnvFile } from "./compare";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-compare-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = makeTmpDir();
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const map = parseEnvFile(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const file = writeFile(tmpDir, ".env", "# comment\n\nKEY=val\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("val");
  });
});

describe("compareEnvFiles", () => {
  it("detects keys only in A", () => {
    const a = writeFile(tmpDir, ".env.a", "ONLY_A=1\nSHARED=x\n");
    const b = writeFile(tmpDir, ".env.b", "SHARED=x\n");
    const result = compareEnvFiles(a, b);
    expect(result.onlyInA).toContain("ONLY_A");
    expect(result.onlyInB).toHaveLength(0);
  });

  it("detects keys only in B", () => {
    const a = writeFile(tmpDir, ".env.a", "SHARED=x\n");
    const b = writeFile(tmpDir, ".env.b", "SHARED=x\nONLY_B=2\n");
    const result = compareEnvFiles(a, b);
    expect(result.onlyInB).toContain("ONLY_B");
    expect(result.onlyInA).toHaveLength(0);
  });

  it("detects differing values", () => {
    const a = writeFile(tmpDir, ".env.a", "KEY=old\n");
    const b = writeFile(tmpDir, ".env.b", "KEY=new\n");
    const result = compareEnvFiles(a, b);
    expect(result.diffValues).toHaveLength(1);
    expect(result.diffValues[0]).toMatchObject({ key: "KEY", valueA: "old", valueB: "new" });
  });

  it("reports matching keys", () => {
    const a = writeFile(tmpDir, ".env.a", "KEY=same\n");
    const b = writeFile(tmpDir, ".env.b", "KEY=same\n");
    const result = compareEnvFiles(a, b);
    expect(result.matching).toContain("KEY");
    expect(result.diffValues).toHaveLength(0);
  });

  it("handles empty files", () => {
    const a = writeFile(tmpDir, ".env.a", "");
    const b = writeFile(tmpDir, ".env.b", "");
    const result = compareEnvFiles(a, b);
    expect(result.onlyInA).toHaveLength(0);
    expect(result.onlyInB).toHaveLength(0);
    expect(result.diffValues).toHaveLength(0);
    expect(result.matching).toHaveLength(0);
  });
});
