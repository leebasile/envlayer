import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { envCopyFile, parseEnvFile } from "./env-copy";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-env-copy-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("envCopyFile", () => {
  it("copies all keys when no filter specified", () => {
    const dir = makeTmpDir();
    const src = writeFile(dir, ".env.src", "FOO=bar\nBAZ=qux\n");
    const dest = path.join(dir, ".env.dest");
    const result = envCopyFile(src, dest, { overwrite: false, dryRun: false });
    expect(result.keysCopied).toEqual(["FOO", "BAZ"]);
    expect(result.keysSkipped).toHaveLength(0);
    const written = parseEnvFile(dest);
    expect(written.get("FOO")).toBe("bar");
    expect(written.get("BAZ")).toBe("qux");
  });

  it("copies only specified keys", () => {
    const dir = makeTmpDir();
    const src = writeFile(dir, ".env.src", "FOO=bar\nBAZ=qux\nSECRET=top\n");
    const dest = path.join(dir, ".env.dest");
    const result = envCopyFile(src, dest, { overwrite: false, keys: ["FOO"], dryRun: false });
    expect(result.keysCopied).toEqual(["FOO"]);
    const written = parseEnvFile(dest);
    expect(written.has("BAZ")).toBe(false);
  });

  it("skips existing keys when overwrite=false", () => {
    const dir = makeTmpDir();
    const src = writeFile(dir, ".env.src", "FOO=new\n");
    const dest = writeFile(dir, ".env.dest", "FOO=old\n");
    const result = envCopyFile(src, dest, { overwrite: false, dryRun: false });
    expect(result.keysSkipped).toContain("FOO");
    const written = parseEnvFile(dest);
    expect(written.get("FOO")).toBe("old");
  });

  it("overwrites existing keys when overwrite=true", () => {
    const dir = makeTmpDir();
    const src = writeFile(dir, ".env.src", "FOO=new\n");
    const dest = writeFile(dir, ".env.dest", "FOO=old\n");
    const result = envCopyFile(src, dest, { overwrite: true, dryRun: false });
    expect(result.overwritten).toContain("FOO");
    const written = parseEnvFile(dest);
    expect(written.get("FOO")).toBe("new");
  });

  it("does not write file in dry run mode", () => {
    const dir = makeTmpDir();
    const src = writeFile(dir, ".env.src", "FOO=bar\n");
    const dest = path.join(dir, ".env.dest");
    const result = envCopyFile(src, dest, { overwrite: false, dryRun: true });
    expect(result.keysCopied).toContain("FOO");
    expect(fs.existsSync(dest)).toBe(false);
  });

  it("skips keys not present in source", () => {
    const dir = makeTmpDir();
    const src = writeFile(dir, ".env.src", "FOO=bar\n");
    const dest = path.join(dir, ".env.dest");
    const result = envCopyFile(src, dest, { overwrite: false, keys: ["MISSING"], dryRun: false });
    expect(result.keysSkipped).toContain("MISSING");
    expect(result.keysCopied).toHaveLength(0);
  });
});
