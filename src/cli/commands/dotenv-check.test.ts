import fs from "fs";
import os from "os";
import path from "path";
import { checkDotenvFile, findGitignore } from "./dotenv-check";
import {
  formatDotenvCheckText,
  formatDotenvCheckJson,
  formatDotenvCheckSummary,
} from "./dotenv-check.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-dotenv-check-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf8");
  return p;
}

describe("findGitignore", () => {
  it("returns path when .gitignore exists in same directory", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".gitignore", ".env\n");
    expect(findGitignore(dir)).toBe(path.join(dir, ".gitignore"));
  });

  it("returns null when no .gitignore found", () => {
    const dir = makeTmpDir();
    expect(findGitignore(dir)).toBeNull();
  });
});

describe("checkDotenvFile", () => {
  it("reports safe when file exists and is git-ignored", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "KEY=value\n");
    writeFile(dir, ".gitignore", ".env\n");
    const result = checkDotenvFile(path.join(dir, ".env"));
    expect(result.exists).toBe(true);
    expect(result.inGitignore).toBe(true);
    expect(result.warning).toBeNull();
  });

  it("warns when file exists but not git-ignored", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "KEY=value\n");
    writeFile(dir, ".gitignore", "node_modules\n");
    const result = checkDotenvFile(path.join(dir, ".env"));
    expect(result.exists).toBe(true);
    expect(result.inGitignore).toBe(false);
    expect(result.warning).toMatch(/NOT listed in .gitignore/);
  });

  it("warns when file does not exist", () => {
    const dir = makeTmpDir();
    const result = checkDotenvFile(path.join(dir, ".env"));
    expect(result.exists).toBe(false);
    expect(result.warning).toMatch(/does not exist/);
  });
});

describe("formatDotenvCheckText", () => {
  it("includes file name and marks in output", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "KEY=val\n");
    writeFile(dir, ".gitignore", ".env\n");
    const result = checkDotenvFile(path.join(dir, ".env"));
    const text = formatDotenvCheckText([result]);
    expect(text).toContain(".env");
    expect(text).toContain("✅");
  });
});

describe("formatDotenvCheckJson", () => {
  it("returns valid JSON array", () => {
    const dir = makeTmpDir();
    const result = checkDotenvFile(path.join(dir, ".env"));
    const json = JSON.parse(formatDotenvCheckJson([result]));
    expect(Array.isArray(json)).toBe(true);
    expect(json[0]).toHaveProperty("exists");
  });
});

describe("formatDotenvCheckSummary", () => {
  it("counts totals correctly", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "KEY=val\n");
    writeFile(dir, ".gitignore", ".env\n");
    const r1 = checkDotenvFile(path.join(dir, ".env"));
    const r2 = checkDotenvFile(path.join(dir, ".env.local"));
    const summary = formatDotenvCheckSummary([r1, r2]);
    expect(summary).toContain("Total checked : 2");
    expect(summary).toContain("Safe          : 1");
    expect(summary).toContain("Missing       : 1");
  });
});
