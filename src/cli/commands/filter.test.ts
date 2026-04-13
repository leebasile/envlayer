import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { filterEnvKeys, parseEnvFile, serializeEnvMap } from "./filter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-filter-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe("filterEnvKeys", () => {
  it("returns keys matching the pattern", () => {
    const map = new Map([["DB_HOST", "localhost"], ["DB_PORT", "5432"], ["APP_NAME", "test"]]);
    const result = filterEnvKeys(map, "^DB_", false);
    expect(result.size).toBe(2);
    expect(result.has("DB_HOST")).toBe(true);
    expect(result.has("DB_PORT")).toBe(true);
    expect(result.has("APP_NAME")).toBe(false);
  });

  it("returns non-matching keys when inverted", () => {
    const map = new Map([["DB_HOST", "localhost"], ["DB_PORT", "5432"], ["APP_NAME", "test"]]);
    const result = filterEnvKeys(map, "^DB_", true);
    expect(result.size).toBe(1);
    expect(result.has("APP_NAME")).toBe(true);
  });

  it("returns empty map when no keys match", () => {
    const map = new Map([["FOO", "bar"]]);
    const result = filterEnvKeys(map, "^MISSING_", false);
    expect(result.size).toBe(0);
  });

  it("returns all keys when pattern matches all", () => {
    const map = new Map([["A", "1"], ["B", "2"]]);
    const result = filterEnvKeys(map, ".*", false);
    expect(result.size).toBe(2);
  });
});

describe("parseEnvFile + filterEnvKeys integration", () => {
  it("reads and filters a real .env file", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "DB_HOST=localhost\nDB_PORT=5432\nAPP_ENV=production\n");
    const map = parseEnvFile(filePath);
    const filtered = filterEnvKeys(map, "^APP_", false);
    expect(filtered.size).toBe(1);
    expect(filtered.get("APP_ENV")).toBe("production");
  });

  it("serializes filtered result correctly", () => {
    const map = new Map([["X", "1"], ["Y", "2"]]);
    const filtered = filterEnvKeys(map, "^X", false);
    const serialized = serializeEnvMap(filtered);
    expect(serialized).toBe("X=1\n");
  });
});
