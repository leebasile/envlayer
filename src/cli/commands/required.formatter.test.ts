import { describe, it, expect } from "vitest";
import {
  formatRequiredText,
  formatRequiredJson,
  formatRequiredSummary,
} from "./required.formatter";
import { RequiredReport } from "./required.types";

const baseReport: RequiredReport = {
  file: "/tmp/test.env",
  keys: [
    { key: "API_KEY", present: true, value: "abc" },
    { key: "DB_URL", present: false },
  ],
  missing: ["DB_URL"],
  present: ["API_KEY"],
  total: 2,
  allPresent: false,
};

describe("formatRequiredText", () => {
  it("includes file path", () => {
    expect(formatRequiredText(baseReport)).toContain("/tmp/test.env");
  });

  it("shows checkmark for present keys", () => {
    expect(formatRequiredText(baseReport)).toContain("✔ API_KEY");
  });

  it("shows cross for missing keys", () => {
    expect(formatRequiredText(baseReport)).toContain("✘ DB_URL");
  });

  it("shows all-present message when no missing keys", () => {
    const report = { ...baseReport, missing: [], allPresent: true };
    expect(formatRequiredText(report)).toContain("All 2 required key(s) are present.");
  });
});

describe("formatRequiredJson", () => {
  it("returns valid JSON", () => {
    const result = JSON.parse(formatRequiredJson(baseReport));
    expect(result.total).toBe(2);
    expect(result.missing).toContain("DB_URL");
  });
});

describe("formatRequiredSummary", () => {
  it("returns FAIL summary when keys are missing", () => {
    expect(formatRequiredSummary(baseReport)).toMatch(/\[FAIL\]/);
  });

  it("returns OK summary when all keys present", () => {
    const report = { ...baseReport, missing: [], allPresent: true };
    expect(formatRequiredSummary(report)).toMatch(/\[OK\]/);
  });
});
