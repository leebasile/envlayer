import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { computeEnvStats, parseEnvFile } from "./stats";
import { formatStatsText, formatStatsJson, formatStatsSummary } from "./stats.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-stats-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs correctly", () => {
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
  });
});

describe("computeEnvStats", () => {
  it("counts total keys", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=1\nB=2\nC=3\n");
    const stats = computeEnvStats(file);
    expect(stats.totalKeys).toBe(3);
  });

  it("detects empty values", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=\nB=hello\n");
    const stats = computeEnvStats(file);
    expect(stats.emptyValues).toBe(1);
  });

  it("counts comment and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nA=1\n");
    const stats = computeEnvStats(file);
    expect(stats.commentLines).toBe(1);
    expect(stats.blankLines).toBe(1);
  });

  it("identifies duplicate values", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=same\nB=same\nC=other\n");
    const stats = computeEnvStats(file);
    expect(stats.duplicateValues).toBe(1);
    expect(stats.uniqueValues).toBe(1);
  });

  it("finds the longest key", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "SHORT=1\nVERY_LONG_KEY_NAME=2\n");
    const stats = computeEnvStats(file);
    expect(stats.longestKey).toBe("VERY_LONG_KEY_NAME");
  });
});

describe("stats formatters", () => {
  const mockStats = {
    totalKeys: 3,
    emptyValues: 1,
    commentLines: 2,
    blankLines: 1,
    uniqueValues: 2,
    duplicateValues: 0,
    longestKey: "MY_KEY",
    longestValue: "some-value",
  };

  it("formatStatsText includes key count", () => {
    const result = formatStatsText("/path/.env", mockStats);
    expect(result).toContain("Total keys");
    expect(result).toContain("3");
  });

  it("formatStatsJson returns valid JSON", () => {
    const result = formatStatsJson("/path/.env", mockStats);
    const parsed = JSON.parse(result);
    expect(parsed.totalKeys).toBe(3);
    expect(parsed.file).toBe("/path/.env");
  });

  it("formatStatsSummary reports empty values as issue", () => {
    const result = formatStatsSummary(mockStats);
    expect(result).toContain("empty value");
  });

  it("formatStatsSummary shows no issues when clean", () => {
    const clean = { ...mockStats, emptyValues: 0, duplicateValues: 0 };
    const result = formatStatsSummary(clean);
    expect(result).toContain("No issues");
  });
});
