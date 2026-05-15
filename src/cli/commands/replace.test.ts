import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { replaceEnvValues, parseEnvFile, serializeEnvMap } from "./replace";
import { formatReplaceText, formatReplaceJson, formatReplaceSummary } from "./replace.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-replace-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe("replaceEnvValues", () => {
  it("replaces matching values", () => {
    const map = new Map([["A", "hello"], ["B", "world"], ["C", "hello world"]]);
    const { updated, result } = replaceEnvValues(map, "hello", "hi", {});
    expect(updated.get("A")).toBe("hi");
    expect(updated.get("C")).toBe("hi world");
    expect(result.replaced).toContain("A");
    expect(result.replaced).toContain("C");
    expect(result.skipped).toContain("B");
  });

  it("respects keys filter", () => {
    const map = new Map([["A", "hello"], ["B", "hello"]]);
    const { updated, result } = replaceEnvValues(map, "hello", "hi", { keys: ["A"] });
    expect(updated.get("A")).toBe("hi");
    expect(updated.get("B")).toBe("hello");
    expect(result.replaced).toEqual(["A"]);
  });

  it("supports regex replacement", () => {
    const map = new Map([["URL", "http://example.com"]]);
    const { updated, result } = replaceEnvValues(map, "https?://", "ftp://", { regex: true });
    expect(updated.get("URL")).toBe("ftp://example.com");
    expect(result.replaced).toContain("URL");
  });

  it("dry-run does not mutate map", () => {
    const map = new Map([["KEY", "old"]]);
    const { updated, result } = replaceEnvValues(map, "old", "new", { dryRun: true });
    expect(updated.get("KEY")).toBe("old");
    expect(result.replaced).toContain("KEY");
  });

  it("returns empty replaced when no match", () => {
    const map = new Map([["KEY", "value"]]);
    const { result } = replaceEnvValues(map, "notfound", "x", {});
    expect(result.replaced).toHaveLength(0);
    expect(result.skipped).toContain("KEY");
  });
});

describe("replace formatters", () => {
  const result = { replaced: ["A", "B"], skipped: ["C"], total: 3 };

  it("formatReplaceText includes summary", () => {
    const text = formatReplaceText(result, ".env", false);
    expect(text).toContain("Replaced:   2");
    expect(text).toContain("- A");
  });

  it("formatReplaceText shows dry-run notice", () => {
    const text = formatReplaceText(result, ".env", true);
    expect(text).toContain("dry-run");
  });

  it("formatReplaceJson is valid JSON", () => {
    const json = formatReplaceJson(result, ".env", false);
    const parsed = JSON.parse(json);
    expect(parsed.replaced).toHaveLength(2);
    expect(parsed.file).toBe(".env");
  });

  it("formatReplaceSummary no replacements", () => {
    const msg = formatReplaceSummary({ replaced: [], skipped: ["A"], total: 1 });
    expect(msg).toBe("No values were replaced.");
  });

  it("formatReplaceSummary with replacements", () => {
    const msg = formatReplaceSummary(result);
    expect(msg).toContain("2 of 3");
  });
});
