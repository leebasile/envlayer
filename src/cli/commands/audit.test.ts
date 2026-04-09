import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { auditEnvFile } from "./audit";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-audit-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("auditEnvFile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns no issues for a clean env file", () => {
    const file = writeFile(tmpDir, ".env", "APP_NAME=myapp\nPORT=3000\nDEBUG=false\n");
    const result = auditEnvFile(file);
    expect(result.emptyValues).toHaveLength(0);
    expect(result.duplicateKeys).toHaveLength(0);
    expect(result.suspiciousKeys).toHaveLength(0);
  });

  it("detects empty values", () => {
    const file = writeFile(tmpDir, ".env", "APP_NAME=\nPORT=3000\n");
    const result = auditEnvFile(file);
    expect(result.emptyValues).toContain("APP_NAME");
  });

  it("detects duplicate keys", () => {
    const file = writeFile(tmpDir, ".env", "PORT=3000\nPORT=4000\n");
    const result = auditEnvFile(file);
    expect(result.duplicateKeys).toContain("PORT");
  });

  it("detects suspicious placeholder values", () => {
    const file = writeFile(tmpDir, ".env", "API_KEY=changeme\nDB_PASSWORD=<your-password>\n");
    const result = auditEnvFile(file);
    expect(result.suspiciousKeys).toContain("API_KEY");
    expect(result.suspiciousKeys).toContain("DB_PASSWORD");
  });

  it("ignores comment lines and blank lines", () => {
    const file = writeFile(tmpDir, ".env", "# This is a comment\n\nAPP_ENV=production\n");
    const result = auditEnvFile(file);
    expect(result.emptyValues).toHaveLength(0);
    expect(result.duplicateKeys).toHaveLength(0);
  });

  it("does not flag sensitive keys with real values", () => {
    const file = writeFile(tmpDir, ".env", "API_KEY=abc123xyz\nDB_PASSWORD=s3cur3p@ss\n");
    const result = auditEnvFile(file);
    expect(result.suspiciousKeys).toHaveLength(0);
  });
});
