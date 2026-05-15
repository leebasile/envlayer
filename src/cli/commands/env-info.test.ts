import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { collectEnvInfo, parseEnvFile } from "./env-info";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-env-info-"));
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

  it("ignores comment lines", () => {
    const map = parseEnvFile("# comment\nFOO=bar\n");
    expect(map.size).toBe(1);
  });

  it("ignores empty lines", () => {
    const map = parseEnvFile("\nFOO=bar\n\n");
    expect(map.size).toBe(1);
  });

  it("strips surrounding quotes from values", () => {
    const map = parseEnvFile('KEY="hello world"\n');
    expect(map.get("KEY")).toBe("hello world");
  });
});

describe("collectEnvInfo", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports correct key count", () => {
    const content = "# header\nFOO=1\nBAR=2\n\nBAZ=3\n";
    const file = writeFile(tmpDir, ".env", content);
    const info = collectEnvInfo(file);
    expect(info.keyCount).toBe(3);
  });

  it("reports correct comment count", () => {
    const content = "# one\n# two\nFOO=bar\n";
    const file = writeFile(tmpDir, ".env", content);
    const info = collectEnvInfo(file);
    expect(info.commentCount).toBe(2);
  });

  it("reports correct empty line count", () => {
    const content = "FOO=bar\n\n\nBAZ=qux\n";
    const file = writeFile(tmpDir, ".env", content);
    const info = collectEnvInfo(file);
    expect(info.emptyLineCount).toBeGreaterThanOrEqual(2);
  });

  it("sets encoding to utf-8", () => {
    const file = writeFile(tmpDir, ".env", "KEY=val\n");
    const info = collectEnvInfo(file);
    expect(info.encoding).toBe("utf-8");
  });

  it("resolves absolute path", () => {
    const file = writeFile(tmpDir, ".env", "KEY=val\n");
    const info = collectEnvInfo(file);
    expect(path.isAbsolute(info.absolutePath)).toBe(true);
  });
});
