import { describe, it, expect } from "vitest";
import {
  formatUnusedText,
  formatUnusedJson,
  formatUnusedSummary,
} from "./unused.formatter";
import { UnusedReport } from "./unused.types";

const makeReport = (unusedKeys: string[] = []): UnusedReport => ({
  results: [
    {
      file: ".env",
      totalKeys: 3,
      unusedKeys: unusedKeys.map((k) => ({ key: k, value: "val", file: ".env" })),
      referencedIn: ["src/index.ts"],
    },
  ],
  totalUnused: unusedKeys.length,
  scannedFiles: ["src/index.ts"],
  sourceFiles: ["src/index.ts"],
});

describe("formatUnusedText", () => {
  it("shows unused keys", () => {
    const out = formatUnusedText(makeReport(["OLD_KEY"]));
    expect(out).toContain("OLD_KEY");
    expect(out).toContain("Unused keys: 1");
  });

  it("shows zero unused", () => {
    const out = formatUnusedText(makeReport([]));
    expect(out).toContain("Unused keys: 0");
  });
});

describe("formatUnusedJson", () => {
  it("returns valid JSON", () => {
    const out = formatUnusedJson(makeReport(["KEY_A"]));
    const parsed = JSON.parse(out);
    expect(parsed.totalUnused).toBe(1);
  });
});

describe("formatUnusedSummary", () => {
  it("returns success message when no unused keys", () => {
    expect(formatUnusedSummary(makeReport([]))).toMatch(/✔/);
  });

  it("returns failure message when unused keys exist", () => {
    expect(formatUnusedSummary(makeReport(["DEAD_KEY"]))).toMatch(/✘/);
  });
});
