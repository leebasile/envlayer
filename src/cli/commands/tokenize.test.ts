import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach } from "vitest";
import {
  parseEnvFile,
  generateToken,
  tokenizeEnvFile,
  serializeEnvMap,
} from "./tokenize";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-tokenize-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("generateToken", () => {
  it("generates a token with the given prefix", () => {
    expect(generateToken("api_key", "TOKEN_")).toBe("TOKEN_API_KEY_TOKEN");
  });

  it("uses empty prefix when provided", () => {
    expect(generateToken("db_pass", "")).toBe("DB_PASS_TOKEN");
  });
});

describe("tokenizeEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it("tokenizes all keys when no keys specified", () => {
    const file = writeFile(tmpDir, ".env", "API_KEY=secret\nDB_PASS=hunter2\n");
    const { entries } = tokenizeEnvFile(file, "TOKEN_", []);
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe("API_KEY");
    expect(entries[0].token).toBe("TOKEN_API_KEY_TOKEN");
    expect(entries[1].key).toBe("DB_PASS");
  });

  it("tokenizes only specified keys", () => {
    const file = writeFile(tmpDir, ".env", "API_KEY=secret\nDB_PASS=hunter2\nPORT=3000\n");
    const { entries } = tokenizeEnvFile(file, "TKN_", ["API_KEY"]);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("API_KEY");
    expect(entries[0].token).toBe("TKN_API_KEY_TOKEN");
  });

  it("returns empty entries when no keys match", () => {
    const file = writeFile(tmpDir, ".env", "PORT=3000\n");
    const { entries } = tokenizeEnvFile(file, "TOKEN_", ["MISSING_KEY"]);
    expect(entries).toHaveLength(0);
  });

  it("skips comment lines and blank lines", () => {
    const file = writeFile(tmpDir, ".env", "# comment\n\nFOO=bar\n");
    const { entries } = tokenizeEnvFile(file, "T_", []);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("FOO");
  });

  it("tokenMap maps key to token", () => {
    const file = writeFile(tmpDir, ".env", "SECRET=abc\n");
    const { tokenMap } = tokenizeEnvFile(file, "TOKEN_", []);
    expect(tokenMap.get("SECRET")).toBe("TOKEN_SECRET_TOKEN");
  });
});
