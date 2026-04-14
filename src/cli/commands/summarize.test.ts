import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { summarizeEnvFile } from "./summarize";
import { formatSummarizeText, formatSummarizeJson, formatSummarizeSummary } from "./summarize.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-summarize-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("summarizeEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("counts total keys correctly", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\nBAZ=qux\n");
    const summary = summarizeEnvFile(file);
    expect(summary.totalKeys).toBe(2);
  });

  it("counts empty values", () => {
    const file = writeFile(tmpDir, ".env", "FOO=\nBAR=hello\n");
    const summary = summarizeEnvFile(file);
    expect(summary.emptyValues).toBe(1);
  });

  it("counts comment lines", () => {
    const file = writeFile(tmpDir, ".env", "# comment\nFOO=bar\n# another\n");
    const summary = summarizeEnvFile(file);
    expect(summary.commentLines).toBe(2);
  });

  it("detects duplicate values", () => {
    const file = writeFile(tmpDir, ".env", "A=same\nB=same\nC=other\n");
    const summary = summarizeEnvFile(file);
    expect(summary.duplicateValues).toBe(1);
    expect(summary.uniqueValues).toBe(1);
  });

  it("handles empty file", () => {
    const file = writeFile(tmpDir, ".env", "");
    const summary = summarizeEnvFile(file);
    expect(summary.totalKeys).toBe(0);
    expect(summary.emptyValues).toBe(0);
  });
});

describe("summarize formatters", () => {
  const sample = {
    file: "/tmp/.env",
    totalKeys: 4,
    emptyValues: 1,
    commentLines: 2,
    uniqueValues: 2,
    duplicateValues: 1,
  };

  it("formatSummarizeText includes all fields", () => {
    const text = formatSummarizeText(sample);
    expect(text).toContain("Total keys:        4");
    expect(text).toContain("Empty values:      1");
  });

  it("formatSummarizeJson is valid JSON", () => {
    const json = formatSummarizeJson(sample);
    const parsed = JSON.parse(json);
    expect(parsed.totalKeys).toBe(4);
  });

  it("formatSummarizeSummary reports issues", () => {
    const msg = formatSummarizeSummary(sample);
    expect(msg).toContain("⚠");
    expect(msg).toContain("empty");
  });

  it("formatSummarizeSummary reports no issues when clean", () => {
    const clean = { ...sample, emptyValues: 0, duplicateValues: 0 };
    const msg = formatSummarizeSummary(clean);
    expect(msg).toContain("✔");
  });
});
