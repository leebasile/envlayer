import { describe, it, expect } from "vitest";
import { formatFreezeText, formatFreezeJson, formatFreezeSummary } from "./freeze.formatter";
import { FreezeResult } from "./freeze.types";

const result: FreezeResult = {
  file: ".env",
  frozen: [{ key: "API_KEY", value: "abc", frozen: true }],
  unfrozen: [],
  skipped: ["MISSING_KEY"],
};

describe("formatFreezeText", () => {
  it("shows frozen keys", () => {
    const out = formatFreezeText(result);
    expect(out).toContain("Frozen keys (1)");
    expect(out).toContain("API_KEY");
  });

  it("shows skipped keys", () => {
    const out = formatFreezeText(result);
    expect(out).toContain("MISSING_KEY");
  });

  it("shows unfrozen when unfreeze=true", () => {
    const r: FreezeResult = { ...result, frozen: [], unfrozen: [{ key: "DB_PASS", value: "x", frozen: false }] };
    const out = formatFreezeText(r, true);
    expect(out).toContain("Unfrozen keys (1)");
    expect(out).toContain("DB_PASS");
  });

  it("shows no keys message when empty", () => {
    const r: FreezeResult = { ...result, frozen: [], skipped: [] };
    const out = formatFreezeText(r);
    expect(out).toContain("No keys frozen.");
  });
});

describe("formatFreezeJson", () => {
  it("returns valid JSON", () => {
    const out = formatFreezeJson(result);
    const parsed = JSON.parse(out);
    expect(parsed.file).toBe(".env");
    expect(parsed.frozen).toHaveLength(1);
  });
});

describe("formatFreezeSummary", () => {
  it("summarizes frozen", () => {
    const out = formatFreezeSummary(result);
    expect(out).toContain("1 key(s) frozen");
    expect(out).toContain("1 skipped");
  });

  it("summarizes unfrozen", () => {
    const r: FreezeResult = { ...result, frozen: [], unfrozen: [{ key: "X", value: "y", frozen: false }], skipped: [] };
    const out = formatFreezeSummary(r, true);
    expect(out).toContain("1 key(s) unfrozen");
  });
});
