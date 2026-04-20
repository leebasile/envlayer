import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { injectEnvFile, parseEnvFile } from "./env";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-env-test-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("injectEnvFile", () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("injects new keys into env file", () => {
    const file = writeFile(dir, ".env", "FOO=bar\n");
    const result = injectEnvFile(file, { BAZ: "qux" });
    expect(result.injected).toEqual(["BAZ"]);
    expect(result.skipped).toEqual([]);
    expect(result.output).toContain("BAZ=qux");
    expect(result.output).toContain("FOO=bar");
  });

  it("skips existing keys when overwrite is false", () => {
    const file = writeFile(dir, ".env", "FOO=bar\n");
    const result = injectEnvFile(file, { FOO: "newval" }, { overwrite: false });
    expect(result.skipped).toContain("FOO");
    expect(result.injected).not.toContain("FOO");
    expect(result.output).toContain("FOO=bar");
  });

  it("overwrites existing keys when overwrite is true", () => {
    const file = writeFile(dir, ".env", "FOO=bar\n");
    const result = injectEnvFile(file, { FOO: "newval" }, { overwrite: true });
    expect(result.injected).toContain("FOO");
    expect(result.output).toContain("FOO=newval");
    expect(result.output).not.toContain("FOO=bar");
  });

  it("injects multiple keys at once", () => {
    const file = writeFile(dir, ".env", "EXISTING=yes\n");
    const result = injectEnvFile(file, { A: "1", B: "2", EXISTING: "no" }, { overwrite: false });
    expect(result.injected).toEqual(expect.arrayContaining(["A", "B"]));
    expect(result.skipped).toContain("EXISTING");
  });

  it("handles empty env file", () => {
    const file = writeFile(dir, ".env", "");
    const result = injectEnvFile(file, { NEW_KEY: "hello" });
    expect(result.injected).toContain("NEW_KEY");
    expect(result.output).toContain("NEW_KEY=hello");
  });

  it("ignores comment lines when parsing", () => {
    const file = writeFile(dir, ".env", "# comment\nFOO=bar\n");
    const map = parseEnvFile(file);
    expect(map.has("FOO")).toBe(true);
    expect(map.size).toBe(1);
  });
});
