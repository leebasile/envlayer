import { describe, it, expect } from "vitest";
import { formatResolveText, formatResolveJson, formatResolveSummary } from "./resolve.formatter";
import { ResolveReport } from "./resolve.types";

const sampleReport: ResolveReport = {
  file: "/tmp/.env",
  totalKeys: 3,
  resolvedCount: 1,
  unresolvedCount: 1,
  results: [
    { key: "APP_NAME", rawValue: "myapp", resolvedValue: "myapp", source: "literal", wasResolved: false },
    { key: "DB_HOST", rawValue: "$BASE_HOST", resolvedValue: "localhost", source: "BASE_HOST", wasResolved: true },
    { key: "SECRET", rawValue: "$MISSING_VAR", resolvedValue: "$MISSING_VAR", source: "(unresolved)", wasResolved: false },
  ],
};

describe("formatResolveSummary", () => {
  it("includes total, resolved, and unresolved counts", () => {
    const out = formatResolveSummary(sampleReport);
    expect(out).toContain("Total: 3");
    expect(out).toContain("Resolved: 1");
    expect(out).toContain("Unresolved refs: 1");
  });
});

describe("formatResolveText", () => {
  it("shows arrow for resolved keys", () => {
    const out = formatResolveText(sampleReport);
    expect(out).toContain("DB_HOST");
    expect(out).toContain("→");
    expect(out).toContain("localhost");
  });

  it("shows (unresolved) for missing refs", () => {
    const out = formatResolveText(sampleReport);
    expect(out).toContain("(unresolved)");
  });

  it("shows literal keys without arrow", () => {
    const out = formatResolveText(sampleReport);
    expect(out).toContain("APP_NAME = myapp");
  });
});

describe("formatResolveJson", () => {
  it("returns valid JSON with expected fields", () => {
    const out = formatResolveJson(sampleReport);
    const parsed = JSON.parse(out);
    expect(parsed.totalKeys).toBe(3);
    expect(parsed.resolvedCount).toBe(1);
    expect(parsed.unresolvedCount).toBe(1);
    expect(parsed.results).toHaveLength(3);
  });
});
