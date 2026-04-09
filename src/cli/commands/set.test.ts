import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { setEnvKey, parseEnvFile, serializeEnvMap } from "./set";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-set-"));
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
    const map = parseEnvFile("# comment\n\nKEY=value\n");
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("value");
  });
});

describe("serializeEnvMap", () => {
  it("serializes map to env file format", () => {
    const map = new Map([["A", "1"], ["B", "2"]]);
    const result = serializeEnvMap(map);
    expect(result).toContain("A=1");
    expect(result).toContain("B=2");
  });
});

describe("setEnvKey", () => {
  it("sets a new key in an existing file", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "EXISTING=yes\n");
    setEnvKey(filePath, "NEW_KEY", "hello");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("NEW_KEY=hello");
    expect(content).toContain("EXISTING=yes");
  });

  it("updates an existing key", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "FOO=old\n");
    setEnvKey(filePath, "FOO", "new");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("FOO=new");
    expect(content).not.toContain("FOO=old");
  });

  it("creates the file if it does not exist", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, ".env.new");
    const { created } = setEnvKey(filePath, "BRAND", "new");
    expect(created).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("BRAND=new");
  });

  it("returns created=false for existing file", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "X=1\n");
    const { created } = setEnvKey(filePath, "Y", "2");
    expect(created).toBe(false);
  });
});
