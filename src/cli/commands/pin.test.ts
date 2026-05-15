import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pinEnvFile, savePinFile, verifyPinFile, parseEnvFile } from "./pin";
import { formatPinText, formatPinSummary, formatVerifyText } from "./pin.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-pin-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const map = parseEnvFile("FOO=bar\nBAZ=qux\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const map = parseEnvFile("# comment\n\nKEY=val\n");
    expect(map.size).toBe(1);
  });
});

describe("pinEnvFile", () => {
  it("returns a PinResult with hash and key count", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const result = pinEnvFile(file);
    expect(result.hash).toHaveLength(64);
    expect(result.keys).toBe(2);
    expect(result.file).toBe(file);
    expect(result.pinnedAt).toBeTruthy();
  });
});

describe("savePinFile and verifyPinFile", () => {
  it("saves and verifies a matching pin", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\n");
    const pinPath = path.join(dir, ".env.pin.json");
    const result = pinEnvFile(file);
    savePinFile(pinPath, result);
    const verify = verifyPinFile(file, pinPath);
    expect(verify.valid).toBe(true);
    expect(verify.expected).toBe(verify.actual);
  });

  it("detects a modified file", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\n");
    const pinPath = path.join(dir, ".env.pin.json");
    savePinFile(pinPath, pinEnvFile(file));
    fs.writeFileSync(file, "FOO=changed\n", "utf-8");
    const verify = verifyPinFile(file, pinPath);
    expect(verify.valid).toBe(false);
    expect(verify.expected).not.toBe(verify.actual);
  });
});

describe("formatPinText", () => {
  it("includes hash and keys", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=1\n");
    const result = pinEnvFile(file);
    const text = formatPinText(result);
    expect(text).toContain(result.hash);
    expect(text).toContain("1");
  });
});

describe("formatPinSummary", () => {
  it("returns a short summary string", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "X=1\nY=2\n");
    const result = pinEnvFile(file);
    const summary = formatPinSummary(result);
    expect(summary).toContain("2 key(s)");
  });
});

describe("formatVerifyText", () => {
  it("shows success on valid", () => {
    const text = formatVerifyText({ valid: true, expected: "abc123", actual: "abc123" }, "test.env");
    expect(text).toContain("✔");
  });

  it("shows mismatch on invalid", () => {
    const text = formatVerifyText({ valid: false, expected: "abc", actual: "xyz" }, "test.env");
    expect(text).toContain("✘");
    expect(text).toContain("abc");
    expect(text).toContain("xyz");
  });
});
