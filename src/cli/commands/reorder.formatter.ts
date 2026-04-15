import { ReorderResult } from './reorder.types';

export function formatReorderText(result: ReorderResult): string {
  const lines: string[] = [];
  lines.push(`File: ${result.file}`);
  lines.push(`Moved ${result.moved} key(s) to ${result.newOrder.indexOf(result.newOrder.find(k => !result.originalOrder.slice(0, result.moved).includes(k)) ?? '') === 0 ? 'top' : 'bottom'}.`);
  lines.push('');
  lines.push('New order:');
  result.newOrder.forEach((key, i) => {
    const marker = !result.originalOrder.slice(0, result.moved).includes(key) ? '' : ' *';
    lines.push(`  ${i + 1}. ${key}${marker}`);
  });
  return lines.join('\n');
}

export function formatReorderJson(result: ReorderResult): string {
  return JSON.stringify(
    {
      file: result.file,
      moved: result.moved,
      originalOrder: result.originalOrder,
      newOrder: result.newOrder,
    },
    null,
    2
  );
}

export function formatReorderSummary(result: ReorderResult): string {
  return `Reordered ${result.moved} key(s) in ${result.file}`;
}
