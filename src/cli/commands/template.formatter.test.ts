import { describe, it, expect } from "vitest";
import { formatTemplateText, formatTemplateJson, formatTemplateSummary } from "./template.formatter";
import type { TemplateResult } from "./template.types";

const baseResult: TemplateResult = {
  outputFile: "config.yml",
  renderedContent: "host: localhost\nport: 5432",
  substitutions: [
    { placeholder: "{{ DB_HOST }}", key: "DB_HOST", value: "localhost", usedDefault: false },
    { placeholder: "{{ DB_PORT:5432 }}", key: "DB_PORT", value: "5432", usedDefault: true },
  ],
  missingVariables: [],
};

describe("formatTemplateText", () => {
  it("includes output file and substitution count", () => {
    const output = formatTemplateText(baseResult);
    expect(output).toContain("config.yml");
    expect(output).toContain("Substitutions: 2");
  });

  it("marks default substitutions", () => {
    const output = formatTemplateText(baseResult);
    expect(output).toContain("(default)");
  });

  it("lists missing variables when present", () => {
    const result = { ...baseResult, missingVariables: ["SECRET_KEY"] };
    const output = formatTemplateText(result);
    expect(output).toContain("Missing variables:");
    expect(output).toContain("SECRET_KEY");
  });
});

describe("formatTemplateJson", () => {
  it("returns valid JSON", () => {
    const output = formatTemplateJson(baseResult);
    const parsed = JSON.parse(output);
    expect(parsed.outputFile).toBe("config.yml");
    expect(parsed.substitutions).toHaveLength(2);
  });
});

describe("formatTemplateSummary", () => {
  it("summarises substitutions and defaults", () => {
    const summary = formatTemplateSummary(baseResult);
    expect(summary).toContain("2 substitution(s)");
    expect(summary).toContain("1 used default");
  });

  it("includes missing count when non-zero", () => {
    const result = { ...baseResult, missingVariables: ["FOO", "BAR"] };
    const summary = formatTemplateSummary(result);
    expect(summary).toContain("2 missing");
  });

  it("omits defaults section when none used", () => {
    const result = {
      ...baseResult,
      substitutions: [
        { placeholder: "{{ DB_HOST }}", key: "DB_HOST", value: "localhost", usedDefault: false },
      ],
    };
    const summary = formatTemplateSummary(result);
    expect(summary).not.toContain("used default");
  });
});
