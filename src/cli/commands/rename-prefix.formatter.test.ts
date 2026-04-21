import { formatRenamePrefixText, formatRenamePrefixJson, formatRenamePrefixSummary } from "./rename-prefix.formatter";
import { RenamePrefixResult } from "./rename-prefix.types";

const baseResult: RenamePrefixResult = {
  file: "/tmp/test.env",
  oldPrefix: "OLD_",
  newPrefix: "NEW_",
  renamedKeys: [
    { from: "OLD_API_KEY", to: "NEW_API_KEY" },
    { from: "OLD_HOST", to: "NEW_HOST" },
  ],
  skippedKeys: [],
  totalKeys: 4,
};

describe("formatRenamePrefixText", () => {
  it("includes file path and prefix info", () => {
    const out = formatRenamePrefixText(baseResult);
    expect(out).toContain("OLD_");
    expect(out).toContain("NEW_");
    expect(out).toContain("/tmp/test.env");
  });

  it("lists renamed keys", () => {
    const out = formatRenamePrefixText(baseResult);
    expect(out).toContain("OLD_API_KEY → NEW_API_KEY");
    expect(out).toContain("OLD_HOST → NEW_HOST");
  });

  it("shows dry-run label when dryRun is true", () => {
    const out = formatRenamePrefixText(baseResult, true);
    expect(out).toContain("[dry-run]");
  });

  it("shows skipped keys if present", () => {
    const result = { ...baseResult, skippedKeys: ["OLD_DB"] };
    const out = formatRenamePrefixText(result);
    expect(out).toContain("OLD_DB");
    expect(out).toContain("Skipped");
  });
});

describe("formatRenamePrefixJson", () => {
  it("returns structured json", () => {
    const json = formatRenamePrefixJson(baseResult);
    expect(json.oldPrefix).toBe("OLD_");
    expect(json.newPrefix).toBe("NEW_");
    expect(json.renamed).toHaveLength(2);
    expect(json.skipped).toHaveLength(0);
  });
});

describe("formatRenamePrefixSummary", () => {
  it("returns a one-liner summary", () => {
    const summary = formatRenamePrefixSummary(baseResult);
    expect(summary).toContain("2 key(s)");
    expect(summary).toContain("OLD_");
    expect(summary).toContain("NEW_");
  });
});
