import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { trimEnvFile, parseEnvFile } from "./trim";
import { formatTrimText, formatTrimJson, formatTrimSummary } from "./trim.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-trim-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("trimEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it("removes keys not in reference file", () => {
    const target = writeFile(tmpDir, ".env", "A=1\nB=2\nC=3\n");
    const ref = writeFile(tmpDir, ".env.ref", "A=x\nC=y\n");
    const result = trimEnvFile(target, ref, false);
    expect(result.removed).toEqual(["B"]);
    expect(result.kept).toBe(2);
    const updated = parseEnvFile(target);
    expect(updated.has("B")).toBe(false);
    expect(updated.has("A")).toBe(true);
  });

  it("does not write file in dry-run mode", () => {
    const target = writeFile(tmpDir, ".env", "A=1\nB=2\n");
    const ref = writeFile(tmpDir, ".env.ref", "A=x\n");
    const originalContent = fs.readFileSync(target, "utf-8");
    const result = trimEnvFile(target, ref, true);
    expect(result.removed).toEqual(["B"]);
    expect(fs.readFileSync(target, "utf-8")).toBe(originalContent);
  });

  it("returns empty removed when all keys are in reference", () => {
    const target = writeFile(tmpDir, ".env", "A=1\nB=2\n");
    const ref = writeFile(tmpDir, ".env.ref", "A=x\nB=y\nC=z\n");
    const result = trimEnvFile(target, ref, false);
    expect(result.removed).toHaveLength(0);
    expect(result.kept).toBe(2);
  });
});

describe("formatTrimText", () => {
  it("shows removed keys", () => {
    const result = { file: "/app/.env", removed: ["OLD_KEY"], kept: 3 };
    const text = formatTrimText(result, false);
    expect(text).toContain("Removed 1 key(s)");
    expect(text).toContain("OLD_KEY");
    expect(text).toContain("Kept: 3");
  });

  it("shows dry-run message", () => {
    const result = { file: "/app/.env", removed: ["X"], kept: 1 };
    const text = formatTrimText(result, true);
    expect(text).toContain("Would remove");
  });

  it("shows no-op message when nothing removed", () => {
    const result = { file: "/app/.env", removed: [], kept: 2 };
    const text = formatTrimText(result, false);
    expect(text).toContain("No keys to trim");
  });
});

describe("formatTrimJson", () => {
  it("returns valid JSON with dryRun field", () => {
    const result = { file: "/app/.env", removed: ["Z"], kept: 1 };
    const json = JSON.parse(formatTrimJson(result, true));
    expect(json.dryRun).toBe(true);
    expect(json.removed).toContain("Z");
  });
});

describe("formatTrimSummary", () => {
  it("aggregates multiple results", () => {
    const results = [
      { file: "a", removed: ["X", "Y"], kept: 2 },
      { file: "b", removed: ["Z"], kept: 5 },
    ];
    const summary = formatTrimSummary(results);
    expect(summary).toContain("2 file(s)");
    expect(summary).toContain("3 key(s) removed");
    expect(summary).toContain("7 key(s) kept");
  });
});
