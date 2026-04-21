import type { ValidationResult } from "../../schema/types";

export interface ValidateReport {
  file: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function formatValidateText(report: ValidateReport): string {
  const lines: string[] = [];
  const status = report.valid ? "✔ valid" : "✖ invalid";
  lines.push(`${status}  ${report.file}`);

  if (report.errors.length > 0) {
    lines.push("  Errors:");
    for (const err of report.errors) {
      lines.push(`    - ${err}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push("  Warnings:");
    for (const warn of report.warnings) {
      lines.push(`    - ${warn}`);
    }
  }

  return lines.join("\n");
}

export function formatValidateJson(report: ValidateReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatValidateSummary(report: ValidateReport): string {
  if (report.valid) {
    return `${report.file}: all checks passed.`;
  }
  const count = report.errors.length;
  return `${report.file}: ${count} error${count !== 1 ? "s" : ""} found.`;
}

export function buildValidateReport(
  file: string,
  result: ValidationResult
): ValidateReport {
  return {
    file,
    valid: result.valid,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
  };
}
