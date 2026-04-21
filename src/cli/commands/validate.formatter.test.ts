import { describe, it, expect } from "vitest";
import {
  formatValidateText,
  formatValidateJson,
  formatValidateSummary,
  buildValidateReport,
} from "./validate.formatter";
import type { ValidationResult } from "../../schema/types";

const makeResult = (overrides: Partial<ValidationResult> = {}): ValidationResult => ({
  valid: true,
  errors: [],
  warnings: [],
  ...overrides,
});

describe("buildValidateReport", () => {
  it("maps a valid result correctly", () => {
    const report = buildValidateReport(".env", makeResult());
    expect(report.file).toBe(".env");
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
  });

  it("maps errors and warnings", () => {
    const result = makeResult({ valid: false, errors: ["Missing KEY"], warnings: ["Deprecated VAR"] });
    const report = buildValidateReport(".env.prod", result);
    expect(report.valid).toBe(false);
    expect(report.errors).toContain("Missing KEY");
    expect(report.warnings).toContain("Deprecated VAR");
  });
});

describe("formatValidateText", () => {
  it("shows valid status with no issues", () => {
    const report = buildValidateReport(".env", makeResult());
    const text = formatValidateText(report);
    expect(text).toContain("✔ valid");
    expect(text).toContain(".env");
  });

  it("shows invalid status with errors listed", () => {
    const report = buildValidateReport(".env", makeResult({ valid: false, errors: ["Missing PORT"] }));
    const text = formatValidateText(report);
    expect(text).toContain("✖ invalid");
    expect(text).toContain("Missing PORT");
  });

  it("includes warnings section when present", () => {
    const report = buildValidateReport(".env", makeResult({ warnings: ["Unused KEY"] }));
    const text = formatValidateText(report);
    expect(text).toContain("Warnings:");
    expect(text).toContain("Unused KEY");
  });
});

describe("formatValidateJson", () => {
  it("returns parseable JSON", () => {
    const report = buildValidateReport(".env", makeResult());
    const json = JSON.parse(formatValidateJson(report));
    expect(json.valid).toBe(true);
    expect(json.file).toBe(".env");
  });
});

describe("formatValidateSummary", () => {
  it("returns passing summary for valid result", () => {
    const report = buildValidateReport(".env", makeResult());
    expect(formatValidateSummary(report)).toContain("all checks passed");
  });

  it("returns error count for invalid result", () => {
    const report = buildValidateReport(".env", makeResult({ valid: false, errors: ["E1", "E2"] }));
    expect(formatValidateSummary(report)).toContain("2 errors found");
  });

  it("uses singular form for a single error", () => {
    const report = buildValidateReport(".env", makeResult({ valid: false, errors: ["E1"] }));
    expect(formatValidateSummary(report)).toContain("1 error found");
  });
});
