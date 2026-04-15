import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { addHeaders, parseEnvFile } from "./headers";
import { formatHeadersText, formatHeadersJson, formatHeadersSummary } from "./headers.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-headers-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("addHeaders", () => {
  it("prepends new keys to the env file", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "EXISTING=yes\n");
    const result = addHeaders(file, { APP_NAME: "envlayer", VERSION: "1.0" }, false);
    expect(result.added).toEqual(["APP_NAME", "VERSION"]);
    expect(result.skipped).toEqual([]);
    const map = parseEnvFile(file);
    expect(map.get("APP_NAME")).toBe("envlayer");
    expect(map.get("VERSION")).toBe("1.0");
    expect(map.get("EXISTING")).toBe("yes");
  });

  it("skips existing keys when overwrite is false", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "APP_NAME=old\n");
    const result = addHeaders(file, { APP_NAME: "new" }, false);
    expect(result.skipped).toContain("APP_NAME");
    expect(result.added).not.toContain("APP_NAME");
    const map = parseEnvFile(file);
    expect(map.get("APP_NAME")).toBe("old");
  });

  it("overwrites existing keys when overwrite is true", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "APP_NAME=old\n");
    const result = addHeaders(file, { APP_NAME: "new" }, true);
    expect(result.added).toContain("APP_NAME");
    expect(result.skipped).not.toContain("APP_NAME");
    const map = parseEnvFile(file);
    expect(map.get("APP_NAME")).toBe("new");
  });

  it("returns empty arrays when no headers given", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "KEY=val\n");
    const result = addHeaders(file, {}, false);
    expect(result.added).toEqual([]);
    expect(result.skipped).toEqual([]);
  });
});

describe("formatHeaders", () => {
  const result = { file: ".env", added: ["APP_NAME"], skipped: ["VERSION"] };

  it("formatHeadersText includes added and skipped", () => {
    const text = formatHeadersText(result);
    expect(text).toContain("APP_NAME");
    expect(text).toContain("VERSION");
  });

  it("formatHeadersJson returns valid JSON", () => {
    const json = JSON.parse(formatHeadersJson(result));
    expect(json.added).toContain("APP_NAME");
  });

  it("formatHeadersSummary summarizes correctly", () => {
    const summary = formatHeadersSummary(result);
    expect(summary).toContain("1/2");
    expect(summary).toContain(".env");
  });
});
