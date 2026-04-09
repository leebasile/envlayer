import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";
import { parseEnvFile } from "./diff";

export interface AuditResult {
  file: string;
  emptyValues: string[];
  duplicateKeys: string[];
  suspiciousKeys: string[];
}

const SUSPICIOUS_PATTERNS = [
  /secret/i,
  /password/i,
  /passwd/i,
  /token/i,
  /api_key/i,
  /private_key/i,
];

export function auditEnvFile(filePath: string): AuditResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const seenKeys = new Set<string>();
  const emptyValues: string[] = [];
  const duplicateKeys: string[] = [];
  const suspiciousKeys: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    if (!value || value === "''" || value === '""') {
      emptyValues.push(key);
    }

    if (seenKeys.has(key)) {
      duplicateKeys.push(key);
    } else {
      seenKeys.add(key);
    }

    if (SUSPICIOUS_PATTERNS.some((p) => p.test(key)) && (!value || value.startsWith("<") || value === "changeme")) {
      suspiciousKeys.push(key);
    }
  }

  return {
    file: filePath,
    emptyValues,
    duplicateKeys,
    suspiciousKeys,
  };
}

export function buildAuditCommand(): Command {
  const cmd = new Command("audit");
  cmd
    .description("Audit an .env file for common issues")
    .argument("<file>", "Path to the .env file to audit")
    .option("--strict", "Exit with non-zero code if any issues are found", false)
    .action((file: string, options: { strict: boolean }) => {
      const resolved = path.resolve(file);
      if (!fs.existsSync(resolved)) {
        console.error(`File not found: ${resolved}`);
        process.exit(1);
      }

      const result = auditEnvFile(resolved);
      let hasIssues = false;

      if (result.emptyValues.length > 0) {
        console.warn(`[WARN] Empty values: ${result.emptyValues.join(", ")}`);
        hasIssues = true;
      }

      if (result.duplicateKeys.length > 0) {
        console.warn(`[WARN] Duplicate keys: ${result.duplicateKeys.join(", ")}`);
        hasIssues = true;
      }

      if (result.suspiciousKeys.length > 0) {
        console.warn(`[WARN] Suspicious placeholder values: ${result.suspiciousKeys.join(", ")}`);
        hasIssues = true;
      }

      if (!hasIssues) {
        console.log("No issues found.");
      }

      if (options.strict && hasIssues) {
        process.exit(1);
      }
    });

  return cmd;
}
