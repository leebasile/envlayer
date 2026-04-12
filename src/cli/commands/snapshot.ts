import fs from "fs";
import path from "path";
import { Command } from "commander";

export interface SnapshotEntry {
  key: string;
  value: string;
}

export interface Snapshot {
  createdAt: string;
  environment: string;
  entries: SnapshotEntry[];
}

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    map.set(key, value);
  }
  return map;
}

export function createSnapshot(envPath: string, environment: string): Snapshot {
  const content = fs.readFileSync(envPath, "utf-8");
  const map = parseEnvFile(content);
  const entries: SnapshotEntry[] = Array.from(map.entries()).map(
    ([key, value]) => ({ key, value })
  );
  return {
    createdAt: new Date().toISOString(),
    environment,
    entries,
  };
}

export function saveSnapshot(snapshot: Snapshot, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2), "utf-8");
}

export function buildSnapshotCommand(): Command {
  const cmd = new Command("snapshot");
  cmd
    .description("Save a snapshot of an env file for later comparison or auditing")
    .argument("<envFile>", "Path to the .env file to snapshot")
    .option("-e, --environment <name>", "Environment label for the snapshot", "default")
    .option("-o, --output <path>", "Output path for the snapshot JSON")
    .action((envFile: string, options: { environment: string; output?: string }) => {
      const resolvedEnv = path.resolve(envFile);
      if (!fs.existsSync(resolvedEnv)) {
        console.error(`Error: File not found: ${resolvedEnv}`);
        process.exit(1);
      }
      const snapshot = createSnapshot(resolvedEnv, options.environment);
      const outputPath =
        options.output ??
        path.join(
          path.dirname(resolvedEnv),
          `.snapshot.${options.environment}.${Date.now()}.json`
        );
      saveSnapshot(snapshot, outputPath);
      console.log(`Snapshot saved to ${outputPath} (${snapshot.entries.length} keys)`);
    });
  return cmd;
}
