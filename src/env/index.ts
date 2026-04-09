export { loadEnvFiles, resolveEnvFiles } from './loader';
export type { LoadOptions, LoadResult } from './loader';

import { loadEnvFiles } from './loader';
import { validateEnv } from '../schema/validator';
import type { EnvSchema } from '../schema/types';
import type { LoadOptions } from './loader';

export interface EnvLayerOptions extends LoadOptions {
  schema: EnvSchema;
}

export interface EnvLayerResult {
  vars: Record<string, string>;
  sources: string[];
  errors: string[];
  valid: boolean;
}

/**
 * High-level helper: loads .env files and validates them against a schema.
 * Returns a structured result with vars, sources, validation errors, and a
 * boolean indicating overall validity.
 */
export function loadAndValidate(options: EnvLayerOptions): EnvLayerResult {
  const { schema, ...loadOptions } = options;
  const { vars, sources } = loadEnvFiles(loadOptions);

  const result = validateEnv(vars, schema);

  return {
    vars,
    sources,
    errors: result.errors,
    valid: result.valid,
  };
}
