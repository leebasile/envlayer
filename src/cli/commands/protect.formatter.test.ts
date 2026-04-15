import { describe, it, expect } from "vitest";
import {
  formatProtectText,
  formatUnprotectText,
  formatProtectJson,
  formatProtectSummary,
} from "./protect.formatter";
import { ProtectResult, UnprotectResult } from "./protect.types";

const sampleProtectResult: ProtectResult = {
  file: ".env",
  protected: [
    { key: "API_KEY", value: "secret", mode: "read-only" },
    { key: "DB_PASS", value: "pass123", mode: "immutable" },
  ],
  alreadyProtected: ["TOKEN"],
  total: 3,
};

const sampleUnprotectResult: UnprotectResult = {
  file: ".env",
  unprotected: ["API_KEY"],
  notFound: ["MISSING_KEY"],
  total: 1,
};

describe("formatProtectText", () => {
  it("includes file name", () => {
    expect(formatProtectText(sampleProtectResult)).toContain(".env");
  });

  it("lists newly protected keys", () => {
    const out = formatProtectText(sampleProtectResult);
    expect(out).toContain("API_KEY");
    expect(out).toContain("DB_PASS");
  });

  it("lists already protected keys", () => {
    expect(formatProtectText(sampleProtectResult)).toContain("TOKEN");
  });

  it("includes total count", () => {
    expect(formatProtectText(sampleProtectResult)).toContain("3");
  });
});

describe("formatUnprotectText", () => {
  it("lists unprotected keys", () => {
    expect(formatUnprotectText(sampleUnprotectResult)).toContain("API_KEY");
  });

  it("lists not found keys", () => {
    expect(formatUnprotectText(sampleUnprotectResult)).toContain("MISSING_KEY");
  });

  it("shows remaining protected count", () => {
    expect(formatUnprotectText(sampleUnprotectResult)).toContain("1");
  });
});

describe("formatProtectJson", () => {
  it("returns valid JSON", () => {
    const json = formatProtectJson(sampleProtectResult);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes all fields", () => {
    const parsed = JSON.parse(formatProtectJson(sampleProtectResult));
    expect(parsed).toHaveProperty("file");
    expect(parsed).toHaveProperty("protected");
    expect(parsed).toHaveProperty("total");
  });
});

describe("formatProtectSummary", () => {
  it("returns a one-line summary", () => {
    const summary = formatProtectSummary(sampleProtectResult);
    expect(summary).toContain("2");
    expect(summary).toContain(".env");
    expect(summary.split("\n")).toHaveLength(1);
  });
});
