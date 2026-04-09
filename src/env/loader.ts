import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export interface LoadOptions {
  environment?: string;
  cwd?: string;
  override?: boolean;
}

export interface LoadResult {
  vars: Record<string, string>;
  sources: string[];
}

/**
 * Resolves the list of .env files to load for a given environment.
 * Priority (highest to lowest): .env.<env>.local, .env.<env>, .env.local, .env
 */
export function resolveEnvFiles(environment?: string, cwd: string = process.cwd()): string[] {
  const candidates: string[] = ['.env'];

  if (environment) {
    candidates.push(`.env.${environment}`);
    candidates.push(`.env.${environment}.local`);
  } else {
    candidates.push('.env.local');
  }

  return candidates
    .map((f) => path.resolve(cwd, f))
    .filter((f) => fs.existsSync(f));
}

/**
 * Loads environment variables from .env files into a plain object.
 * Does NOT mutate process.env unless override is true.
 */
export function loadEnvFiles(options: LoadOptions = {}): LoadResult {
  const { environment, cwd = process.cwd(), override = false } = options;
  const sources = resolveEnvFiles(environment, cwd);
  const vars: Record<string, string> = {};

  for (const filePath of sources) {
    const parsed = dotenv.parse(fs.readFileSync(filePath));
    for (const [key, value] of Object.entries(parsed)) {
      if (override || !(key in vars)) {
        vars[key] = value;
      }
    }
  }

  return { vars, sources };
}
