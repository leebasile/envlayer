import path from "path";
import type { CompareReport } from "./compare.types";

export function formatCompareText(report: CompareReport): string {
  const lines: string[] = [];
  const nameA = path.basename(report.fileA);
  const nameB = path.basename(report.fileB);

  if (report.diff.onlyInA.length > 0) {
    lines.push(`\nOnly in ${nameA}:`);
    report.diff.onlyInA.forEach((k) => lines.push(`  - ${k}`));
  }

  if (report.diff.onlyInB.length > 0) {
    lines.push(`\nOnly in ${nameB}:`);
    report.diff.onlyInB.forEach((k) => lines.push(`  + ${k}`));
  }

  if (report.diff.diffValues.length > 0) {
    lines.push(`\nDifferent values:`);
    report.diff.diffValues.forEach(({ key, valueA, valueB }) => {
      lines.push(`  ~ ${key}`);
      lines.push(`      ${nameA}: ${valueA}`);
      lines.push(`      ${nameB}: ${valueB}`);
    });
  }

  if (report.identical) {
    lines.push("Files are identical.");
  } else {
    lines.push(`\nSummary: ${report.totalDifferences} difference(s) found.`);
  }

  return lines.join("\n");
}

export function formatCompareJson(report: CompareReport): string {
  return JSON.stringify(
    {
      fileA: report.fileA,
      fileB: report.fileB,
      identical: report.identical,
      totalDifferences: report.totalDifferences,
      diff: report.diff,
    },
    null,
    2
  );
}

export function buildCompareReport(
  fileA: string,
  fileB: string,
  diff: CompareReport["diff"]
): CompareReport {
  const totalDifferences =
    diff.onlyInA.length + diff.onlyInB.length + diff.diffValues.length;
  return {
    fileA,
    fileB,
    diff,
    totalDifferences,
    identical: totalDifferences === 0,
  };
}
