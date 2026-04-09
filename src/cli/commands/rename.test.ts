import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { renameEnvKey, buildRenameCommand } from "./rename";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-rename-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("renameEnvKey", () => {
  it("renames a matching key", () => {
    const input = "OLD_KEY=value\nOTHER=foo";
    const { content, count } = renameEnvKey(input, "OLD_KEY", "NEW_KEY");
    expect(count).toBe(1);
    expect(content).toContain("NEW_KEY=value");
    expect(content).not.toContain("OLD_KEY");
  });

  it("returns count 0 when key not found", () => {
    const input = "SOME_KEY=abc";
    const { count } = renameEnvKey(input, "MISSING_KEY", "NEW_KEY");
    expect(count).toBe(0);
  });

  it("does not rename commented lines", () => {
    const input = "# OLD_KEY=value\nOLD_KEY=real";
    const { content, count } = renameEnvKey(input, "OLD_KEY", "NEW_KEY");
    expect(count).toBe(1);
    expect(content).toContain("# OLD_KEY=value");
    expect(content).toContain("NEW_KEY=real");
  });

  it("preserves value including equals signs", () => {
    const input = "SECRET=abc=def=ghi";
    const { content } = renameEnvKey(input, "SECRET", "TOKEN");
    expect(content).toBe("TOKEN=abc=def=ghi");
  });
});

describe("buildRenameCommand", () => {
  it("renames key in file and writes result", () => {
    const dir = makeTmpDir();
    const filePath = writeFile(dir, ".env", "DB_HOST=localhost\nDB_PORT=5432\n");

    const cmd = buildRenameCommand();
    cmd.parse(["node", "test", "DB_HOST", "DATABASE_HOST", "--files", filePath]);

    const result = fs.readFileSync(filePath, "utf-8");
    expect(result).toContain("DATABASE_HOST=localhost");
    expect(result).not.toContain("DB_HOST=");
  });

  it("does not write file in dry-run mode", () => {
    const dir = makeTmpDir();
    const original = "API_KEY=secret\n";
    const filePath = writeFile(dir, ".env", original);

    const cmd = buildRenameCommand();
    cmd.parse(["node", "test", "API_KEY", "API_TOKEN", "--files", filePath, "--dry-run"]);

    const result = fs.readFileSync(filePath, "utf-8");
    expect(result).toBe(original);
  });
});
