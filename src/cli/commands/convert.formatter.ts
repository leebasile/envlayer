import type { ConvertResult } from './convert.types';

export function formatConvertText(result: ConvertResult): string {
  const lines: string[] = [];
  lines.push(`Conversion: ${result.fromFormat} → ${result.toFormat}`);
  lines.push(`Input:      ${result.inputFile}`);
  lines.push(`Output:     ${result.outputFile}`);
  lines.push(`Keys:       ${result.keysConverted}`);
  lines.push(`Status:     ${result.success ? 'success' : 'failed'}`);
  return lines.join('\n');
}

export function formatConvertJson(result: ConvertResult): string {
  return JSON.stringify(
    {
      inputFile: result.inputFile,
      outputFile: result.outputFile,
      fromFormat: result.fromFormat,
      toFormat: result.toFormat,
      keysConverted: result.keysConverted,
      success: result.success,
    },
    null,
    2
  );
}

export function formatConvertSummary(result: ConvertResult): string {
  return `[convert] ${result.keysConverted} key(s) converted from ${result.fromFormat} to ${result.toFormat} → ${result.outputFile}`;
}
