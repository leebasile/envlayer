import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parseEnvFile, getEnvKey } from "./get";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-get-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "FOO=bar\nBAZ=qux\n");
    const map = parseEnvFile(file);
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("strips quotes from values", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", 'KEY="hello world"\n');
    const map = parseEnvFile(file);
    expect(map.get("KEY")).toBe("hello world");
  });

  it("ignores comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nFOO=1\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("FOO")).toBe("1");
  });
});

describe("getEnvKey", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = makeTmpDir();
    file = writeFile(dir, ".env", "API_KEY=secret123\nDEBUG=true\n");
  });

  it("prints value for existing key", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    getEnvKey(file, "API_KEY", {});
    expect(spy).toHaveBeenCalledWith("secret123");
    spy.mockRestore();
  });

  it("outputs JSON when --json flag is set", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    getEnvKey(file, "DEBUG", { json: true });
    const output = JSON.parse(spy.mock.calls[0][0]);
    expect(output.key).toBe("DEBUG");
    expect(output.value).toBe("true");
    spy.mockRestore();
  });

  it("uses fallback when key is missing", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    getEnvKey(file, "MISSING_KEY", { fallback: "default_val" });
    expect(spy).toHaveBeenCalledWith("default_val");
    spy.mockRestore();
  });

  it("exits with error when key is missing and no fallback", () => {
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => { throw new Error("exit"); });
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => getEnvKey(file, "MISSING_KEY", {})).toThrow("exit");
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
    errSpy.mockRestore();
  });
});
