import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { groupEnvByPrefix, parseEnvFile } from "./groupby";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-groupby-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("groupEnvByPrefix", () => {
  it("groups keys by prefix using default separator", () => {
    const env = { DB_HOST: "localhost", DB_PORT: "5432", APP_NAME: "myapp", PORT: "3000" };
    const result = groupEnvByPrefix(env);
    expect(result.groups["DB"]).toEqual({ DB_HOST: "localhost", DB_PORT: "5432" });
    expect(result.groups["APP"]).toEqual({ APP_NAME: "myapp" });
    expect(result.ungrouped).toEqual({ PORT: "3000" });
    expect(result.totalKeys).toBe(4);
  });

  it("uses custom separator", () => {
    const env = { "DB.HOST": "localhost", "DB.PORT": "5432", PLAIN: "value" };
    const result = groupEnvByPrefix(env, ".");
    expect(result.groups["DB"]).toEqual({ "DB.HOST": "localhost", "DB.PORT": "5432" });
    expect(result.ungrouped).toEqual({ PLAIN: "value" });
  });

  it("returns all keys as ungrouped when no separator found", () => {
    const env = { FOO: "1", BAR: "2" };
    const result = groupEnvByPrefix(env);
    expect(result.groups).toEqual({});
    expect(result.ungrouped).toEqual({ FOO: "1", BAR: "2" });
  });

  it("handles empty env", () => {
    const result = groupEnvByPrefix({});
    expect(result.groups).toEqual({});
    expect(result.ungrouped).toEqual({});
    expect(result.totalKeys).toBe(0);
  });
});

describe("parseEnvFile for groupby", () => {
  it("parses a real file and groups correctly", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "DB_HOST=localhost\nDB_PORT=5432\n# comment\nAPP_NAME=test\n");
    const env = parseEnvFile(filePath);
    const result = groupEnvByPrefix(env);
    expect(Object.keys(result.groups)).toContain("DB");
    expect(Object.keys(result.groups)).toContain("APP");
  });
});
