import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { checkRequiredKeys } from "./required";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-required-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("checkRequiredKeys", () => {
  it("detects all present keys", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "API_KEY=abc\nDB_URL=postgres://localhost\n");
    const report = checkRequiredKeys(file, ["API_KEY", "DB_URL"]);
    expect(report.allPresent).toBe(true);
    expect(report.missing).toHaveLength(0);
    expect(report.present).toEqual(["API_KEY", "DB_URL"]);
  });

  it("detects missing keys", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "API_KEY=abc\n");
    const report = checkRequiredKeys(file, ["API_KEY", "SECRET"]);
    expect(report.allPresent).toBe(false);
    expect(report.missing).toContain("SECRET");
  });

  it("returns correct total count", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=1\nB=2\n");
    const report = checkRequiredKeys(file, ["A", "B", "C"]);
    expect(report.total).toBe(3);
  });

  it("ignores comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nFOO=bar\n");
    const report = checkRequiredKeys(file, ["FOO"]);
    expect(report.allPresent).toBe(true);
  });

  it("returns key results with correct present flag", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "X=1\n");
    const report = checkRequiredKeys(file, ["X", "Y"]);
    const x = report.keys.find((k) => k.key === "X");
    const y = report.keys.find((k) => k.key === "Y");
    expect(x?.present).toBe(true);
    expect(y?.present).toBe(false);
  });
});
