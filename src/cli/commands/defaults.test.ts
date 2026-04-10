import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { applyDefaults, parseEnvFile, serializeEnvMap } from "./defaults";
import {
  buildDefaultsReport,
  formatDefaultsText,
  formatDefaultsJson,
  formatDefaultsSummary,
} from "./defaults.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-defaults-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

describe("applyDefaults", () => {
  it("applies missing keys from defaults", () => {
    const existing = new Map([["A", "1"]]);
    const defaults = new Map([
      ["A", "99"],
      ["B", "2"],
    ]);
    const { result, applied } = applyDefaults(existing, defaults);
    expect(result.get("A")).toBe("1");
    expect(result.get("B")).toBe("2");
    expect(applied).toEqual(["B"]);
  });

  it("returns empty applied when all keys exist", () => {
    const existing = new Map([["A", "1"]]);
    const defaults = new Map([["A", "99"]]);
    const { applied } = applyDefaults(existing, defaults);
    expect(applied).toHaveLength(0);
  });

  it("applies all keys when existing is empty", () => {
    const existing = new Map<string, string>();
    const defaults = new Map([["X", "10"], ["Y", "20"]]);
    const { result, applied } = applyDefaults(existing, defaults);
    expect(applied).toHaveLength(2);
    expect(result.get("X")).toBe("10");
    expect(result.get("Y")).toBe("20");
  });
});

describe("buildDefaultsReport + formatters", () => {
  it("builds a correct report", () => {
    const report = buildDefaultsReport(["B"], ["A", "B"]);
    expect(report.applied).toEqual(["B"]);
    expect(report.skipped).toEqual(["A"]);
    expect(report.total).toBe(1);
  });

  it("formatDefaultsText includes applied keys", () => {
    const report = buildDefaultsReport(["B"], ["A", "B"]);
    const text = formatDefaultsText(report);
    expect(text).toContain("+ B");
    expect(text).toContain("~ A");
  });

  it("formatDefaultsJson returns valid JSON", () => {
    const report = buildDefaultsReport(["B"], ["A", "B"]);
    const json = JSON.parse(formatDefaultsJson(report));
    expect(json.applied).toEqual(["B"]);
    expect(json.skipped).toEqual(["A"]);
  });

  it("formatDefaultsSummary shows counts", () => {
    const report = buildDefaultsReport(["B"], ["A", "B"]);
    const summary = formatDefaultsSummary(report);
    expect(summary).toContain("1 applied");
    expect(summary).toContain("1 skipped");
  });

  it("formatDefaultsText shows no defaults message when none applied", () => {
    const report = buildDefaultsReport([], ["A"]);
    const text = formatDefaultsText(report);
    expect(text).toContain("No defaults applied");
  });
});
