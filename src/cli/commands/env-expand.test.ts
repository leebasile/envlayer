import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expandEnvValues, parseEnvFile, serializeEnvMap } from "./env-expand";
import {
  buildEnvExpandReport,
  formatEnvExpandText,
  formatEnvExpandJson,
  formatEnvExpandSummary,
} from "./env-expand.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-env-expand-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("expandEnvValues", () => {
  it("expands ${VAR} references using values in the same map", () => {
    const map = new Map([
      ["BASE", "/home/user"],
      ["CONFIG", "${BASE}/.config"],
    ]);
    const result = expandEnvValues(map, {});
    expect(result.get("CONFIG")).toBe("/home/user/.config");
  });

  it("expands $VAR references", () => {
    const map = new Map([
      ["APP", "myapp"],
      ["LOG", "/var/log/$APP"],
    ]);
    const result = expandEnvValues(map, {});
    expect(result.get("LOG")).toBe("/var/log/myapp");
  });

  it("falls back to context for unresolved variables", () => {
    const map = new Map([["PATH_EXT", "${EXTERNAL}/sub"]]);
    const result = expandEnvValues(map, { EXTERNAL: "/ext" });
    expect(result.get("PATH_EXT")).toBe("/ext/sub");
  });

  it("leaves unresolved variables as empty string", () => {
    const map = new Map([["KEY", "${MISSING_VAR}"]]);
    const result = expandEnvValues(map, {});
    expect(result.get("KEY")).toBe("");
  });

  it("does not mutate the original map", () => {
    const map = new Map([["A", "${B}"], ["B", "val"]]);
    expandEnvValues(map, {});
    expect(map.get("A")).toBe("${B}");
  });
});

describe("parseEnvFile + expandEnvValues integration", () => {
  it("reads and expands a real file", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "BASE=/opt\nFULL=${BASE}/bin\n");
    const map = parseEnvFile(file);
    const expanded = expandEnvValues(map, {});
    expect(expanded.get("FULL")).toBe("/opt/bin");
  });
});

describe("formatter", () => {
  const original = new Map([["A", "${B}"], ["B", "hello"]]);
  const expanded = new Map([["A", "hello"], ["B", "hello"]]);

  it("buildEnvExpandReport marks changed keys", () => {
    const report = buildEnvExpandReport(original, expanded);
    const a = report.find((r) => r.key === "A")!;
    expect(a.changed).toBe(true);
    expect(a.expanded).toBe("hello");
    const b = report.find((r) => r.key === "B")!;
    expect(b.changed).toBe(false);
  });

  it("formatEnvExpandText lists changed keys", () => {
    const report = buildEnvExpandReport(original, expanded);
    const text = formatEnvExpandText(report);
    expect(text).toContain("Expanded 1 variable");
    expect(text).toContain("A");
  });

  it("formatEnvExpandJson returns valid JSON", () => {
    const report = buildEnvExpandReport(original, expanded);
    const json = formatEnvExpandJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("formatEnvExpandSummary returns summary string", () => {
    const report = buildEnvExpandReport(original, expanded);
    const summary = formatEnvExpandSummary(report);
    expect(summary).toContain("1/2 keys expanded");
  });
});
