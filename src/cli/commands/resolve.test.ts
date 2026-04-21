import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { parseEnvFile, resolveEnvValues } from "./resolve";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-resolve-"));
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

  it("skips comments and blank lines", () => {
    const dir = makeTmpDir();
    const file = writeFile(dir, ".env", "# comment\n\nKEY=val\n");
    const map = parseEnvFile(file);
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("val");
  });
});

describe("resolveEnvValues", () => {
  it("resolves $VAR references from system env", () => {
    const envMap = new Map([["HOST", "$BASE_HOST"]]);
    const results = resolveEnvValues(envMap, { BASE_HOST: "localhost" });
    expect(results[0].resolvedValue).toBe("localhost");
    expect(results[0].wasResolved).toBe(true);
    expect(results[0].source).toBe("BASE_HOST");
  });

  it("resolves ${VAR} references from system env", () => {
    const envMap = new Map([["PORT", "${APP_PORT}"]]);
    const results = resolveEnvValues(envMap, { APP_PORT: "3000" });
    expect(results[0].resolvedValue).toBe("3000");
    expect(results[0].wasResolved).toBe(true);
  });

  it("marks unresolvable refs as unresolved", () => {
    const envMap = new Map([["SECRET", "$MISSING"]]);
    const results = resolveEnvValues(envMap, {});
    expect(results[0].wasResolved).toBe(false);
    expect(results[0].source).toBe("(unresolved)");
  });

  it("leaves literal values unchanged", () => {
    const envMap = new Map([["NAME", "myapp"]]);
    const results = resolveEnvValues(envMap, {});
    expect(results[0].resolvedValue).toBe("myapp");
    expect(results[0].wasResolved).toBe(false);
    expect(results[0].source).toBe("literal");
  });

  it("resolves self-referencing keys from envMap", () => {
    const envMap = new Map([["A", "hello"], ["B", "$A"]]);
    const results = resolveEnvValues(envMap, {});
    const b = results.find((r) => r.key === "B")!;
    expect(b.resolvedValue).toBe("hello");
    expect(b.wasResolved).toBe(true);
  });
});
