import { Command } from 'commander';
import { buildValidateCommand } from './commands/validate';
import { buildDiffCommand } from './commands/diff';

const pkg = {
  name: 'envlayer',
  version: '0.1.0',
  description: 'Manage and validate environment variable schemas across multiple deployment environments',
};

export function buildCLI(): Command {
  const program = new Command();

  program
    .name(pkg.name)
    .description(pkg.description)
    .version(pkg.version);

  program.addCommand(buildValidateCommand());
  program.addCommand(buildDiffCommand());

  return program;
}

export function runCLI(argv: string[] = process.argv): void {
  const program = buildCLI();
  program.parse(argv);
}
