import type { TemplateResult } from "./template.types";

export function formatTemplateText(result: TemplateResult): string {
  const lines: string[] = [];
  lines.push(`Output file : ${result.outputFile}`);
  lines.push(`Substitutions: ${result.substitutions.length}`);

  if (result.substitutions.length > 0) {
    lines.push("");
    lines.push("Substitutions:");
    for (const sub of result.substitutions) {
      const tag = sub.usedDefault ? " (default)" : "";
      lines.push(`  {{ ${sub.key} }} => ${sub.value}${tag}`);
    }
  }

  if (result.missingVariables.length > 0) {
    lines.push("");
    lines.push("Missing variables:");
    for (const key of result.missingVariables) {
      lines.push(`  - ${key}`);
    }
  }

  return lines.join("\n");
}

export function formatTemplateJson(result: TemplateResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatTemplateSummary(result: TemplateResult): string {
  const missing = result.missingVariables.length;
  const subs = result.substitutions.length;
  const defaults = result.substitutions.filter((s) => s.usedDefault).length;
  const parts = [`${subs} substitution(s)`];
  if (defaults > 0) parts.push(`${defaults} used default`);
  if (missing > 0) parts.push(`${missing} missing`);
  return parts.join(", ");
}
