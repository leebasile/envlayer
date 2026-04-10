import { LintResult, LintViolation } from './lint.types';

const SEVERITY_ICONS: Record<string, string> = {
  error: '✖',
  warn: '⚠',
  info: 'ℹ',
};

function formatViolation(v: LintViolation): string {
  return `  ${SEVERITY_ICONS[v.severity]} [${v.severity.toUpperCase()}] ${v.rule}: ${v.message}`;
}

export function formatLintText(result: LintResult): string {
  const lines: string[] = [`Linting: ${result.file}`];

  if (result.violations.length === 0) {
    lines.push('  ✔ No issues found.');
  } else {
    for (const v of result.violations) {
      lines.push(formatViolation(v));
    }
  }

  lines.push('');
  lines.push(
    `Summary: ${result.errorCount} error(s), ${result.warnCount} warning(s) — ${
      result.passed ? 'PASSED' : 'FAILED'
    }`
  );

  return lines.join('\n');
}

export function formatLintJson(result: LintResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatLintSummary(result: LintResult): string {
  return `${result.file}: ${result.errorCount} error(s), ${result.warnCount} warning(s)`;
}
