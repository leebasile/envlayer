import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { dedupeEnvFile, parseEnvFile, serializeEnvMap } from "./dedupe";
import { formatDedupeText, formatDedupeJson, formatDedupeSummary } from "./dedupe.formatter";

function makeTmpDir(): string {
  return fs.join(os.tmpdir(), "envlayer-dedupe-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}
escribe("dedupeEnvFile", () => {
  it("returns empty removed list when no duplicates", () => {
    const content =O=1\nBAR=2\nBAZ=3\n";
    const { removed, kept } = dedupeEnvFile(content);
    expect(removed).toEqual([]);
    expect(kept.size).toBe(3);
  });

  it("removes duplicate keys, keeping first occurrence", () => {
    const content = "FOO=1\nBAR=2\nFOO=99\n";
    const { removed, kept } = dedupeEnvFile(content);
    expect(removed).toEqual(["FOO"]);
    expect(kept.get("FOO")).toBe("1");
  });

  it("handles multiple duplicates of the same key", () => {
    const content = "A=1\nA=2\nA=3\n";
    const { removed, kept } = dedupeEnvFile(content);
    expect(removed).toEqual(["A", "A"]);
    expect(kept.get("A")).toBe("1");
  });

  it("ignores comment lines", () => {
    const content = "# comment\nFOO=1\n# another\nFOO=2\n";
    const { removed, kept } = dedupeEnvFile(content);
    expect(removed).toEqual(["FOO"]);
    expect(kept.get("FOO")).toBe("1");
  });
});

describe("formatDedupeText", () => {
  it("reports no duplicates found", () => {
    const result = { removed: [], kept: new Map([["A", "1"]]) };
    const out = formatDedupeText(result, ".env");
    expect(out).toContain("No duplicate keys found");
    expect(out).toContain("Remaining keys: 1");
  });

  it("lists removed keys", () => {
    const result = { removed: ["FOO"], kept: new Map([["FOO", "1"], ["BAR", "2"]]) };
    const out = formatDedupeText(result, ".env");
    expect(out).toContain("- FOO");
    expect(out).toContain("Remaining keys: 2");
  });
});

describe("formatDedupeJson", () => {
  it("outputs valid JSON with expected fields", () => {
    const result = { removed: ["X"], kept: new Map([["A", "1"]]) };
    const json = JSON.parse(formatDedupeJson(result, "test.env"));
    expect(json.removed).toEqual(["X"]);
    expect(json.removedCount).toBe(1);
    expect(json.kept).toEqual({ A: "1" });
  });
});

describe("formatDedupeSummary", () => {
  it("returns no duplicates message", () => {
    expect(formatDedupeSummary({ removed: [], kept: new Map() })).toContain("no duplicates");
  });

  it("returns removed count summary", () => {
    expect(formatDedupeSummary({ removed: ["FOO", "BAR"], kept: new Map() })).toContain("2 duplicate");
  });
});
