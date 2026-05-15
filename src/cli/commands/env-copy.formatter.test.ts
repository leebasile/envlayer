import { describe, it, expect } from "vitest";
import { formatEnvCopyText, formatEnvCopyJson, formatEnvCopySummary } from "./env-copy.formatter";
import { EnvCopyResult } from "./env-copy.types";

const baseResult: EnvCopyResult = {
  source: ".env.staging",
  destination: ".env.production",
  keysCopied: ["API_URL", "TIMEOUT"],
  keysSkipped: ["SECRET_KEY"],
  overwritten: ["API_URL"],
};

describe("formatEnvCopyText", () => {
  it("includes source and destination", () => {
    const out = formatEnvCopyText(baseResult);
    expect(out).toContain(".env.staging");
    expect(out).toContain(".env.production");
  });

  it("shows copied count", () => {
    const out = formatEnvCopyText(baseResult);
    expect(out).toContain("2 key(s)");
  });

  it("shows overwritten keys", () => {
    const out = formatEnvCopyText(baseResult);
    expect(out).toContain("API_URL");
  });

  it("shows skipped keys", () => {
    const out = formatEnvCopyText(baseResult);
    expect(out).toContain("SECRET_KEY");
  });

  it("shows dry run notice when dryRun=true", () => {
    const out = formatEnvCopyText(baseResult, true);
    expect(out).toContain("dry run");
  });

  it("omits dry run notice when dryRun=false", () => {
    const out = formatEnvCopyText(baseResult, false);
    expect(out).not.toContain("dry run");
  });
});

describe("formatEnvCopyJson", () => {
  it("returns valid JSON", () => {
    const out = formatEnvCopyJson(baseResult);
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it("includes dryRun field", () => {
    const out = JSON.parse(formatEnvCopyJson(baseResult, true));
    expect(out.dryRun).toBe(true);
  });

  it("includes keysCopied array", () => {
    const out = JSON.parse(formatEnvCopyJson(baseResult));
    expect(out.keysCopied).toEqual(["API_URL", "TIMEOUT"]);
  });
});

describe("formatEnvCopySummary", () => {
  it("contains copied count", () => {
    const out = formatEnvCopySummary(baseResult);
    expect(out).toContain("copied=2");
  });

  it("contains skipped count", () => {
    const out = formatEnvCopySummary(baseResult);
    expect(out).toContain("skipped=1");
  });

  it("contains overwritten count when present", () => {
    const out = formatEnvCopySummary(baseResult);
    expect(out).toContain("overwritten=1");
  });

  it("omits overwritten when none", () => {
    const out = formatEnvCopySummary({ ...baseResult, overwritten: [] });
    expect(out).not.toContain("overwritten");
  });
});
