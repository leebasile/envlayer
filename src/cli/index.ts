import { Command } from 'commander';
import { buildValidateCommand } from './commands/validate';
import { buildDiffCommand } from './commands/diff';
import { buildInitCommand } from './commands/init';
import { buildListCommand } from './commands/list';
import { buildCheckCommand } from './commands/check';
import { buildExportCommand } from './commands/export';
import { buildMergeCommand } from './commands/merge';
import { buildAuditCommand } from './commands/audit';
import { buildCopyCommand } from './commands/copy';

export function buildCLI(): Command {
  const program = new Command();

  program
    .name('envlayer')
    .description('Manage and validate environment variable schemas across multiple deployment environments')
    .version('1.0.0');

  program.addCommand(buildInitCommand());
  program.addCommand(buildValidateCommand());
  program.addCommand(buildDiffCommand());
  program.addCommand(buildListCommand());
  program.addCommand(buildCheckCommand());
  program.addCommand(buildExportCommand());
  program.addCommand(buildMergeCommand());
  program.addCommand(buildAuditCommand());
  program.addCommand(buildCopyCommand());

  return program;
}

export async function runCLI(): Promise<void> {
  const program = buildCLI();
  await program.parseAsync(process.argv);
}
