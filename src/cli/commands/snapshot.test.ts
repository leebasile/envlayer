import fs from "fs";
import os from "os";
import path from "path";
import { createSnapshot, saveSnapshot, parseEnvFile } from "./snapshot";
import { formatSnapshotText, formatSnapshotJson, formatSnapshotSummary } from "./snapshot.formatter";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envlayer-snapshot-"));
}

function writeFile(dir: string, name: string, content: string): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, content, "utf-8");
  return filePath;
}

describe("parseEnvFile", () => {
  it("parses key=value pairs", () => {
    const map = parseEnvFile("FOO=bar\nBAZ=qux\n");
    expect(map.get("FOO")).toBe("bar");
    expect(map.get("BAZ")).toBe("qux");
  });

  it("ignores comments and blank lines", () => {
    const map = parseEnvFile("# comment\n\nKEY=value\n");
    expect(map.size).toBe(1);
    expect(map.get("KEY")).toBe("value");
  });
});

describe("createSnapshot", () => {
  it("captures all keys from an env file", () => {
    const dir = makeTmpDir();
    const envFile = writeFile(dir, ".env", "DB_HOST=localhost\nDB_PORT=5432\n");
    const snapshot = createSnapshot(envFile, "production");
    expect(snapshot.environment).toBe("production");
    expect(snapshot.entries).toHaveLength(2);
    expect(snapshot.entries.find((e) => e.key === "DB_HOST")?.value).toBe("localhost");
    expect(snapshot.createdAt).toBeTruthy();
  });
});

describe("saveSnapshot", () => {
  it("writes a valid JSON file", () => {
    const dir = makeTmpDir();
    const envFile = writeFile(dir, ".env", "API_KEY=secret\n");
    const snapshot = createSnapshot(envFile, "staging");
    const outputPath = path.join(dir, "snapshot.json");
    saveSnapshot(snapshot, outputPath);
    const loaded = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
    expect(loaded.environment).toBe("staging");
    expect(loaded.entries).toHaveLength(1);
  });
});

describe("formatters", () => {
  const snapshot = {
    createdAt: "2024-01-01T00:00:00.000Z",
    environment: "test",
    entries: [{ key: "FOO", value: "bar" }],
  };

  it("formatSnapshotText includes environment and keys", () => {
    const text = formatSnapshotText(snapshot);
    expect(text).toContain("test");
    expect(text).toContain("FOO=bar");
  });

  it("formatSnapshotJson returns valid JSON", () => {
    const json = JSON.parse(formatSnapshotJson(snapshot));
    expect(json.environment).toBe("test");
  });

  it("formatSnapshotSummary is concise", () => {
    const summary = formatSnapshotSummary(snapshot);
    expect(summary).toContain("[test]");
    expect(summary).toContain("1 keys");
  });
});
