import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { loadSchema } from './validate';
import { validateEnv } from '../../schema/validator';

export interface CheckResult {
  environment: string;
  file: string;
  valid: boolean;
  missing: string[];
  extra: string[];
  errors: string[];
}

/**
 * Derives the environment name from a .env file path.
 * Examples: ".env.production" -> "production", ".env" -> "default"
 */
function deriveEnvironmentName(filePath: string): string {
  const basename = path.basename(filePath);
  const match = basename.match(/^\.env\.?(.*)$/);
  return match && match[1] ? match[1] : 'default';
}

/**
 * Checks a single .env file against the given schema.
 * Returns a CheckResult describing validity, missing keys, extra keys, and errors.
 */
export function checkEnvFile(envFilePath: string, schemaPath: string): CheckResult {
  const environment = deriveEnvironmentName(envFilePath);
  const schema = loadSchema(schemaPath);

  if (!fs.existsSync(envFilePath)) {
    return { environment, file: envFilePath, valid: false, missing: [], extra: [], errors: [`File not found: ${envFilePath}`] };
  }

  const parsed = dotenv.parse(fs.readFileSync(envFilePath));
  const result = validateEnv(parsed, schema);

  const schemaKeys = Object.keys(schema);
  const envKeys = Object.keys(parsed);
  const extra = envKeys.filter(k => !schemaKeys.includes(k));

  return {
    environment,
    file: envFilePath,
    valid: result.valid,
    missing: result.missing ?? [],
    extra,
    errors: result.errors ?? [],
  };
}

export function buildCheckCommand(): Command {
  const cmd = new Command('check');

  cmd
    .description('Check one or more .env files against a schema')
    .argument('<files...>', '.env files to check')
    .option('-s, --schema <path>', 'path to schema file', 'envlayer.schema.json')
    .option('--strict', 'fail on extra keys not defined in schema', false)
    .action((files: string[], options: { schema: string; strict: boolean }) => {
      let allValid = true;

      for (const file of files) {
        const result = checkEnvFile(file, options.schema);

        if (options.strict && result.extra.length > 0) {
          result.valid = false;
          result.errors.push(`Extra keys not in schema: ${result.extra.join(', ')}`);
        }

        const status = result.valid ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✘ FAIL\x1b[0m';
        console.log(`${status}  ${result.file} (env: ${result.environment})`);

        if (!result.valid) {
          allValid = false;
          for (const err of result.errors) {
            console.log(`       ${err}`);
          }
        }

        if (result.extra.length > 0) {
          console.log(`  \x1b[33m⚠ Extra keys:\x1b[0m ${result.extra.join(', ')}`);
        }
      }

      if (!allValid) process.exit(1);
    });

  return cmd;
}
