import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseEnvFile, interpolateValues, serializeEnvMap } from "./interpolate";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-interpolate-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("interpolateValues", () => {
  it("resolves simple variable references", () => {
    const env = new Map([
      ["BASE_URL", "https://example.com"],
      ["API_URL", "${BASE_URL}/api"],
    ]);
    const result = interpolateValues(env);
    expect(result.get("API_URL")).toBe("https://example.com/api");
  });

  it("leaves unresolvable references unchanged", () => {
    const env = new Map([["URL", "${UNDEFINED_VAR}/path"]]);
    const result = interpolateValues(env);
    expect(result.get("URL")).toBe("${UNDEFINED_VAR}/path");
  });

  it("resolves chained references", () => {
    const env = new Map([
      ["HOST", "localhost"],
      ["PORT", "5432"],
      ["DB_HOST", "${HOST}"],
      ["DB_URL", "postgres://${DB_HOST}:${PORT}/mydb"],
    ]);
    const result = interpolateValues(env);
    expect(result.get("DB_URL")).toBe("postgres://localhost:5432/mydb");
  });

  it("does not modify keys without references", () => {
    const env = new Map([["PLAIN", "value123"]]);
    const result = interpolateValues(env);
    expect(result.get("PLAIN")).toBe("value123");
  });

  it("handles self-referencing without infinite loop", () => {
    const env = new Map([["A", "${A}"]]);
    const result = interpolateValues(env);
    expect(result.get("A")).toBe("${A}");
  });
});

describe("parseEnvFile + interpolateValues integration", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reads and interpolates a real env file", () => {
    const filePath = writeFile(
      tmpDir,
      ".env",
      "PROTO=https\nDOMAIN=example.com\nBASE=${PROTO}://${DOMAIN}\nAPI=${BASE}/api\n"
    );
    const env = parseEnvFile(filePath);
    const result = interpolateValues(env);
    expect(result.get("BASE")).toBe("https://example.com");
    expect(result.get("API")).toBe("https://example.com/api");
  });

  it("serializes interpolated map correctly", () => {
    const env = new Map([["KEY", "value"]]);
    const serialized = serializeEnvMap(env);
    expect(serialized).toBe("KEY=value\n");
  });
});
