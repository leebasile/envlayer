import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { flattenEnvFiles, parseEnvFile, serializeEnvMap } from "./flatten";
import {
  buildFlattenResult,
  formatFlattenText,
  formatFlattenJson,
  formatFlattenSummary,
} from "./flatten.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-flatten-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("flattenEnvFiles", () => {
  it("merges multiple env files with last-wins precedence", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, ".env.a", "FOO=a\nBAR=base\n");
    const b = writeFile(dir, ".env.b", "BAR=override\nBAZ=new\n");
    const { merged, overrides } = flattenEnvFiles([a, b]);
    expect(merged.get("FOO")).toBe("a");
    expect(merged.get("BAR")).toBe("override");
    expect(merged.get("BAZ")).toBe("new");
    expect(overrides["BAR"]).toBeDefined();
  });

  it("has no overrides when keys are unique", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, ".env.a", "FOO=1\n");
    const b = writeFile(dir, ".env.b", "BAR=2\n");
    const { overrides } = flattenEnvFiles([a, b]);
    expect(Object.keys(overrides)).toHaveLength(0);
  });

  it("handles a single file", () => {
    const dir = makeTmpDir();
    const a = writeFile(dir, ".env.a", "KEY=value\n");
    const { merged } = flattenEnvFiles([a]);
    expect(merged.get("KEY")).toBe("value");
  });
});

describe("flatten formatter", () => {
  it("formatFlattenText shows no conflicts message", () => {
    const merged = new Map([["A", "1"]]);
    const result = buildFlattenResult(merged, {});
    const text = formatFlattenText(result);
    expect(text).toContain("No key conflicts");
  });

  it("formatFlattenText lists overridden keys", () => {
    const merged = new Map([["A", "2"]]);
    const result = buildFlattenResult(merged, { A: ["1"] });
    const text = formatFlattenText(result);
    expect(text).toContain("Overridden keys");
    expect(text).toContain("A");
  });

  it("formatFlattenJson returns valid JSON", () => {
    const merged = new Map([["X", "y"]]);
    const result = buildFlattenResult(merged, {});
    const json = JSON.parse(formatFlattenJson(result));
    expect(json.totalKeys).toBe(1);
    expect(json.merged.X).toBe("y");
  });

  it("formatFlattenSummary returns summary string", () => {
    const merged = new Map([["A", "1"],["B", "2"]]);
    const result = buildFlattenResult(merged, { A: ["0"] });
    const summary = formatFlattenSummary(result);
    expect(summary).toContain("2 keys merged");
    expect(summary).toContain("1 conflict");
  });
});
