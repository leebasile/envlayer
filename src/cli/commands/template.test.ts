import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { parseEnvFile, extractTemplateVariables, renderTemplate } from "./template";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-template-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "DB_HOST=localhost\nDB_PORT=5432\n");
    const map = parseEnvFile(file);
    expect(map.get("DB_HOST")).toBe("localhost");
    expect(map.get("DB_PORT")).toBe("5432");
  });

  it("ignores comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nFOO=bar\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("FOO")).toBe("bar");
  });
});

describe("extractTemplateVariables", () => {
  it("extracts simple placeholders", () => {
    const vars = extractTemplateVariables("host: {{ DB_HOST }}\nport: {{ DB_PORT }}");
    expect(vars).toHaveLength(2);
    expect(vars[0].key).toBe("DB_HOST");
    expect(vars[0].required).toBe(true);
  });

  it("extracts placeholders with defaults", () => {
    const vars = extractTemplateVariables("port: {{ DB_PORT:5432 }}");
    expect(vars[0].defaultValue).toBe("5432");
    expect(vars[0].required).toBe(false);
  });

  it("deduplicates repeated placeholders", () => {
    const vars = extractTemplateVariables("{{ FOO }} and {{ FOO }}");
    expect(vars).toHaveLength(1);
  });
});

describe("renderTemplate", () => {
  it("substitutes values from env map", () => {
    const envMap = new Map([["DB_HOST", "localhost"]]);
    const result = renderTemplate("host: {{ DB_HOST }}", envMap);
    expect(result.renderedContent).toBe("host: localhost");
    expect(result.substitutions).toHaveLength(1);
    expect(result.substitutions[0].usedDefault).toBe(false);
  });

  it("uses default value when key is absent", () => {
    const envMap = new Map<string, string>();
    const result = renderTemplate("port: {{ DB_PORT:5432 }}", envMap);
    expect(result.renderedContent).toBe("port: 5432");
    expect(result.substitutions[0].usedDefault).toBe(true);
  });

  it("records missing variables", () => {
    const envMap = new Map<string, string>();
    const result = renderTemplate("key: {{ SECRET_KEY }}", envMap);
    expect(result.missingVariables).toContain("SECRET_KEY");
    expect(result.renderedContent).toContain("{{ SECRET_KEY }}");
  });

  it("handles multiple substitutions in one template", () => {
    const envMap = new Map([["A", "alpha"], ["B", "beta"]]);
    const result = renderTemplate("{{ A }}-{{ B }}", envMap);
    expect(result.renderedContent).toBe("alpha-beta");
    expect(result.substitutions).toHaveLength(2);
  });
});
