import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  parseEnvFile,
  getProtectedKeys,
  protectEnvFile,
  unprotectEnvFile,
  serializeEnvMap,
} from "./protect";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-protect-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const map = parseEnvFile("API_KEY=abc\nDB_PASS=secret\n");
    expect(map.get("API_KEY")).toBe("abc");
    expect(map.get("DB_PASS")).toBe("secret");
  });

  it("ignores comments and blank lines", () => {
    const map = parseEnvFile("# comment\n\nFOO=bar\n");
    expect(map.size).toBe(1);
    expect(map.get("FOO")).toBe("bar");
  });
});

describe("getProtectedKeys", () => {
  it("extracts keys marked with protect comment", () => {
    const content = "# envlayer:protect:API_KEY\nAPI_KEY=secret\n";
    const keys = getProtectedKeys(content);
    expect(keys.has("API_KEY")).toBe(true);
  });

  it("returns empty set if no protected keys", () => {
    const keys = getProtectedKeys("FOO=bar\n");
    expect(keys.size).toBe(0);
  });
});

describe("protectEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it("marks keys as protected in the file", () => {
    const file = writeFile(tmpDir, ".env", "API_KEY=abc\nDB_PASS=secret\n");
    const result = protectEnvFile(file, ["API_KEY"]);
    expect(result.protected).toHaveLength(1);
    expect(result.protected[0].key).toBe("API_KEY");
    const updated = fs.readFileSync(file, "utf-8");
    expect(updated).toContain("# envlayer:protect:API_KEY");
  });

  it("reports already protected keys", () => {
    const file = writeFile(tmpDir, ".env", "# envlayer:protect:API_KEY\nAPI_KEY=abc\n");
    const result = protectEnvFile(file, ["API_KEY"]);
    expect(result.alreadyProtected).toContain("API_KEY");
    expect(result.protected).toHaveLength(0);
  });
});

describe("unprotectEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it("removes protection from keys", () => {
    const file = writeFile(tmpDir, ".env", "# envlayer:protect:API_KEY\nAPI_KEY=abc\n");
    const result = unprotectEnvFile(file, ["API_KEY"]);
    expect(result.unprotected).toContain("API_KEY");
    const updated = fs.readFileSync(file, "utf-8");
    expect(updated).not.toContain("# envlayer:protect:API_KEY");
  });

  it("reports keys not found or not protected", () => {
    const file = writeFile(tmpDir, ".env", "FOO=bar\n");
    const result = unprotectEnvFile(file, ["MISSING"]);
    expect(result.notFound).toContain("MISSING");
  });
});
