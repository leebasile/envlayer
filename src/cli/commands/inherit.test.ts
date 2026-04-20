import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { inheritEnvFiles, parseEnvFile } from "./inherit";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-inherit-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("inheritEnvFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("inherits all keys from base when override is empty", () => {
    const base = writeFile(tmpDir, ".env.base", "A=1\nB=2\nC=3\n");
    const override = writeFile(tmpDir, ".env.override", "");
    const output = path.join(tmpDir, ".env.out");

    const result = inheritEnvFiles(base, override, output);

    expect(result.inherited).toBe(3);
    expect(result.overridden).toBe(0);
    expect(result.added).toBe(0);

    const merged = parseEnvFile(output);
    expect(merged.get("A")).toBe("1");
    expect(merged.get("B")).toBe("2");
    expect(merged.get("C")).toBe("3");
  });

  it("overrides existing keys from base", () => {
    const base = writeFile(tmpDir, ".env.base", "A=1\nB=2\n");
    const override = writeFile(tmpDir, ".env.override", "B=99\n");
    const output = path.join(tmpDir, ".env.out");

    const result = inheritEnvFiles(base, override, output);

    expect(result.inherited).toBe(1);
    expect(result.overridden).toBe(1);
    expect(result.added).toBe(0);

    const merged = parseEnvFile(output);
    expect(merged.get("A")).toBe("1");
    expect(merged.get("B")).toBe("99");
  });

  it("adds new keys from override that are not in base", () => {
    const base = writeFile(tmpDir, ".env.base", "A=1\n");
    const override = writeFile(tmpDir, ".env.override", "B=2\nC=3\n");
    const output = path.join(tmpDir, ".env.out");

    const result = inheritEnvFiles(base, override, output);

    expect(result.inherited).toBe(1);
    expect(result.overridden).toBe(0);
    expect(result.added).toBe(2);

    const merged = parseEnvFile(output);
    expect(merged.get("A")).toBe("1");
    expect(merged.get("B")).toBe("2");
    expect(merged.get("C")).toBe("3");
  });

  it("writes output file to disk", () => {
    const base = writeFile(tmpDir, ".env.base", "X=hello\n");
    const override = writeFile(tmpDir, ".env.override", "Y=world\n");
    const output = path.join(tmpDir, ".env.out");

    inheritEnvFiles(base, override, output);

    expect(fs.existsSync(output)).toBe(true);
    const contents = fs.readFileSync(output, "utf-8");
    expect(contents).toContain("X=hello");
    expect(contents).toContain("Y=world");
  });

  it("handles both override and base keys simultaneously", () => {
    const base = writeFile(tmpDir, ".env.base", "A=1\nB=2\nC=3\n");
    const override = writeFile(tmpDir, ".env.override", "B=20\nD=4\n");
    const output = path.join(tmpDir, ".env.out");

    const result = inheritEnvFiles(base, override, output);

    expect(result.inherited).toBe(2);
    expect(result.overridden).toBe(1);
    expect(result.added).toBe(1);
  });
});
