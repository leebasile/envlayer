import fs from "fs";
import os from "os";
import path from "path";
import { renamePrefixEnvKeys } from "./rename-prefix";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-rename-prefix-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("renamePrefixEnvKeys", () => {
  it("renames keys matching the old prefix", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "OLD_API=key1\nOLD_HOST=localhost\nPORT=3000\n");
    const result = renamePrefixEnvKeys(file, "OLD_", "NEW_");
    expect(result.renamedKeys).toHaveLength(2);
    expect(result.renamedKeys[0]).toEqual({ from: "OLD_API", to: "NEW_API" });
    const written = fs.readFileSync(file, "utf-8");
    expect(written).toContain("NEW_API=key1");
    expect(written).toContain("NEW_HOST=localhost");
    expect(written).not.toContain("OLD_API");
  });

  it("does not modify keys that do not match the prefix", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "PORT=3000\nDEBUG=true\n");
    const result = renamePrefixEnvKeys(file, "OLD_", "NEW_");
    expect(result.renamedKeys).toHaveLength(0);
    const written = fs.readFileSync(file, "utf-8");
    expect(written).toContain("PORT=3000");
  });

  it("skips keys where the new key already exists", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "OLD_KEY=old\nNEW_KEY=existing\n");
    const result = renamePrefixEnvKeys(file, "OLD_", "NEW_");
    expect(result.skippedKeys).toContain("OLD_KEY");
    expect(result.renamedKeys).toHaveLength(0);
  });

  it("does not write file in dry-run mode", () => {
    const dir = makeTmpDir();
    const original = "OLD_X=1\n";
    const file = writeFile(dir, ".env", original);
    renamePrefixEnvKeys(file, "OLD_", "NEW_", true);
    const written = fs.readFileSync(file, "utf-8");
    expect(written).toBe(original);
  });

  it("returns correct totalKeys count", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "A=1\nB=2\nC=3\n");
    const result = renamePrefixEnvKeys(file, "A", "Z");
    expect(result.totalKeys).toBe(3);
  });
});
