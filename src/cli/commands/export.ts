import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { parseEnvFileEntries } from './list';

export type ExportFormat = 'json' | 'dotenv' | 'yaml';

export function exportEnvFile(
  filePath: string,
  format: ExportFormat
): string {
  const entries = parseEnvFileEntries(filePath);

  switch (format) {
    case 'json': {
      const obj: Record<string, string> = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return JSON.stringify(obj, null, 2);
    }
    case 'yaml': {
      const lines = entries.map(([key, value]) => {
        const escaped = value.includes(':') ? `"${value}"` : value;
        return `${key}: ${escaped}`;
      });
      return lines.join('\n');
    }
    case 'dotenv':
    default: {
      return entries
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    }
  }
}

export function buildExportCommand(): Command {
  const cmd = new Command('export');

  cmd
    .description('Export environment variables to a specific format')
    .argument('<file>', 'Path to the .env file')
    .option('-f, --format <format>', 'Output format: json | dotenv | yaml', 'json')
    .option('-o, --output <output>', 'Output file path (defaults to stdout)')
    .action((file: string, options: { format: string; output?: string }) => {
      const resolvedPath = path.resolve(file);

      if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: File not found: ${resolvedPath}`);
        process.exit(1);
      }

      const format = options.format as ExportFormat;
      const validFormats: ExportFormat[] = ['json', 'dotenv', 'yaml'];

      if (!validFormats.includes(format)) {
        console.error(`Error: Invalid format "${format}". Choose from: ${validFormats.join(', ')}`);
        process.exit(1);
      }

      const output = exportEnvFile(resolvedPath, format);

      if (options.output) {
        const outPath = path.resolve(options.output);
        fs.writeFileSync(outPath, output, 'utf-8');
        console.log(`Exported to ${outPath}`);
      } else {
        console.log(output);
      }
    });

  return cmd;
}
