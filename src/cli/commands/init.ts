import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';

const DEFAULT_SCHEMA = {
  version: 1,
  environments: ['development', 'staging', 'production'],
  variables: {
    NODE_ENV: {
      type: 'string',
      required: true,
      description: 'The current runtime environment'
    },
    PORT: {
      type: 'number',
      required: false,
      default: 3000,
      description: 'Port the server listens on'
    },
    DATABASE_URL: {
      type: 'string',
      required: true,
      description: 'Connection string for the database'
    },
    LOG_LEVEL: {
      type: 'string',
      required: false,
      default: 'info',
      enum: ['debug', 'info', 'warn', 'error'],
      description: 'Log verbosity level'
    }
  }
};

function writeSchemaFile(outputPath: string, force: boolean): void {
  const resolved = path.resolve(outputPath);

  if (fs.existsSync(resolved) && !force) {
    throw new Error(
      `Schema file already exists at ${resolved}. Use --force to overwrite.`
    );
  }

  fs.writeFileSync(resolved, JSON.stringify(DEFAULT_SCHEMA, null, 2) + '\n', 'utf-8');
}

export function buildInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Scaffold a new envlayer schema file')
    .option('-o, --output <path>', 'Output path for the schema file', 'envlayer.schema.json')
    .option('-f, --force', 'Overwrite existing schema file', false)
    .action((options: { output: string; force: boolean }) => {
      try {
        writeSchemaFile(options.output, options.force);
        console.log(`✔ Schema file created at ${path.resolve(options.output)}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`✖ ${message}`);
        process.exit(1);
      }
    });

  return cmd;
}
