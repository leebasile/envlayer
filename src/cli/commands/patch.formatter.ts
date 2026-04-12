import { PatchOperation, PatchResult } from './patch.types';

function describeOp(op: PatchOperation): string {
  if (op.op === 'set') return `  set   ${op.key}=${op.value}`;
  if (op.op === 'delete') return `  delete ${op.key}`;
  if (op.op === 'rename') return `  rename ${op.key} -> ${op.newKey}`;
  return `  unknown op`;
}

export function formatPatchText(result: PatchResult, dryRun = false): string {
  const lines: string[] = [];
  lines.push(`Patch result for: ${result.outputFile}`);
  lines.push(`Applied (${result.applied.length}):`);
  if (result.applied.length === 0) lines.push('  (none)');
  else result.applied.forEach(op => lines.push(describeOp(op)));
  lines.push(`Skipped (${result.skipped.length}):`);
  if (result.skipped.length === 0) lines.push('  (none)');
  else result.skipped.forEach(op => lines.push(describeOp(op)));
  if (dryRun) lines.push('\n[dry-run] No files were modified.');
  return lines.join('\n');
}

export function formatPatchJson(result: PatchResult, dryRun = false): string {
  return JSON.stringify({ ...result, dryRun }, null, 2);
}

export function formatPatchSummary(result: PatchResult): string {
  return `${result.applied.length} applied, ${result.skipped.length} skipped → ${result.outputFile}`;
}
