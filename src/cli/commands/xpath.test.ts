import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { xpathEnvKeys, parseEnvFile } from "./xpath";
import { formatXpathText, formatXpathJson, formatXpathSummary } from "./xpath.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-xpath-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("xpathEnvKeys", () => {
  const env = new Map([
    ["DB_HOST", "localhost"],
    ["DB_PORT", "5432"],
    ["APP_URL", "https://example.com"],
    ["SECRET_KEY", "abc123"],
  ]);

  it("matches prefix glob", () => {
    const result = xpathEnvKeys(env, "DB_*");
    expect(result.size).toBe(2);
    expect(result.has("DB_HOST")).toBe(true);
    expect(result.has("DB_PORT")).toBe(true);
  });

  it("matches suffix glob", () => {
    const result = xpathEnvKeys(env, "*_URL");
    expect(result.size).toBe(1);
    expect(result.has("APP_URL")).toBe(true);
  });

  it("matches exact key", () => {
    const result = xpathEnvKeys(env, "SECRET_KEY");
    expect(result.size).toBe(1);
    expect(result.get("SECRET_KEY")).toBe("abc123");
  });

  it("returns empty map when no match", () => {
    const result = xpathEnvKeys(env, "MISSING_*");
    expect(result.size).toBe(0);
  });

  it("matches wildcard alone", () => {
    const result = xpathEnvKeys(env, "*");
    expect(result.size).toBe(4);
  });
});

describe("parseEnvFile + xpathEnvKeys integration", () => {
  it("reads file and applies expression", () => {
    const dir = makeTmpDir();
    writeFile(dir, ".env", "API_KEY=secret\nAPI_URL=https://api.example.com\nDEBUG=true\n");
    const env = parseEnvFile(path.join(dir, ".env"));
    const result = xpathEnvKeys(env, "API_*");
    expect(result.size).toBe(2);
    expect(result.get("API_KEY")).toBe("secret");
  });
});

describe("xpath formatters", () => {
  const result = { expression: "DB_*", matched: { DB_HOST: "localhost" }, count: 1 };

  it("formatXpathText includes expression and key", () => {
    const out = formatXpathText(result);
    expect(out).toContain("DB_*");
    expect(out).toContain("DB_HOST=localhost");
  });

  it("formatXpathJson returns valid JSON", () => {
    const out = formatXpathJson(result);
    const parsed = JSON.parse(out);
    expect(parsed.count).toBe(1);
    expect(parsed.keys["DB_HOST"]).toBe("localhost");
  });

  it("formatXpathSummary is concise", () => {
    const out = formatXpathSummary(result);
    expect(out).toContain("1 key(s)");
    expect(out).toContain("DB_*");
  });
});
