import { describe, it, expect } from "vitest";
import {
  formatCompareText,
  formatCompareJson,
  buildCompareReport,
} from "./compare.formatter";
import type { CompareReport } from "./compare.types";

const baseDiff = {
  onlyInA: [],
  onlyInB: [],
  diffValues: [],
  matching: [],
};

describe("buildCompareReport", () => {
  it("marks identical when no differences", () => {
    const report = buildCompareReport("/a/.env", "/b/.env", baseDiff);
    expect(report.identical).toBe(true);
    expect(report.totalDifferences).toBe(0);
  });

  it("counts total differences correctly", () => {
    const diff = {
      ...baseDiff,
      onlyInA: ["A"],
      onlyInB: ["B", "C"],
      diffValues: [{ key: "X", valueA: "1", valueB: "2" }],
    };
    const report = buildCompareReport("/a/.env", "/b/.env", diff);
    expect(report.totalDifferences).toBe(4);
    expect(report.identical).toBe(false);
  });
});

describe("formatCompareText", () => {
  it("outputs identical message for matching files", () => {
    const report = buildCompareReport("/a/.env", "/b/.env", baseDiff);
    const output = formatCompareText(report);
    expect(output).toContain("Files are identical.");
  });

  it("shows keys only in A", () => {
    const diff = { ...baseDiff, onlyInA: ["SECRET"] };
    const report = buildCompareReport("/a/.env", "/b/.env", diff);
    const output = formatCompareText(report);
    expect(output).toContain("Only in .env");
    expect(output).toContain("- SECRET");
  });

  it("shows differing values", () => {
    const diff = {
      ...baseDiff,
      diffValues: [{ key: "PORT", valueA: "3000", valueB: "4000" }],
    };
    const report = buildCompareReport("/a/.env", "/b/.env", diff);
    const output = formatCompareText(report);
    expect(output).toContain("~ PORT");
    expect(output).toContain("3000");
    expect(output).toContain("4000");
  });
});

describe("formatCompareJson", () => {
  it("returns valid JSON", () => {
    const report = buildCompareReport("/a/.env", "/b/.env", baseDiff);
    const json = formatCompareJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.identical).toBe(true);
    expect(parsed.totalDifferences).toBe(0);
  });

  it("includes diff details in JSON output", () => {
    const diff = { ...baseDiff, onlyInB: ["NEW_KEY"] };
    const report = buildCompareReport("/a/.env", "/b/.env", diff);
    const parsed = JSON.parse(formatCompareJson(report));
    expect(parsed.diff.onlyInB).toContain("NEW_KEY");
  });
});
