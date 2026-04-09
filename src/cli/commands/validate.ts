import { Command } from 'commander';
import path from 'path';
import { loadAndValidate } from '../../env/index';
import { EnvSchema } from '../../schema/types';
import fs from 'fs';

function loadSchema(schemaPath: string): EnvSchema {
  const resolved = path.resolve(process.cwd(), schemaPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Schema file not found: ${resolved}`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(raw) as EnvSchema;
  } catch (err) {
    console.error(`Failed to parse schema file: ${(err as Error).message}`);
    process.exit(1);
  }
}

export function buildValidateCommand(): Command {
  const cmd = new Command('validate');

  cmd
    .description('Validate environment variables against a schema')
    .requiredOption('-s, --schema <path>', 'Path to the JSON schema file')
    .option('-e, --env <environment>', 'Target environment (e.g. production, staging)', 'development')
    .option('-d, --dir <directory>', 'Base directory to search for .env files', process.cwd())
    .action((options: { schema: string; env: string; dir: string }) => {
      const schema = loadSchema(options.schema);

      try {
        const result = loadAndValidate({
          environment: options.env,
          baseDir: options.dir,
          schema,
        });

        if (result.errors.length > 0) {
          console.error(`\n❌ Validation failed for environment: ${options.env}`);
          result.errors.forEach((err) => {
            console.error(`  - ${err}`);
          });
          process.exit(1);
        }

        console.log(`\n✅ Environment "${options.env}" is valid.`);
        console.log(`   Loaded ${Object.keys(result.values).length} variable(s).`);
      } catch (err) {
        console.error(`Unexpected error: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  return cmd;
}
