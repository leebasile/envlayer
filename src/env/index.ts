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

/**
 * Like {@link loadAndValidate}, but throws an `Error` if validation fails.
 * The error message includes all validation errors joined by newlines,
 * making it convenient for fail-fast startup scenarios.
 *
 * @throws {Error} When one or more schema validation errors are found.
 */
export function loadAndValidateOrThrow(options: EnvLayerOptions): Omit<EnvLayerResult, 'errors' | 'valid'> {
  const result = loadAndValidate(options);

  if (!result.valid) {
    throw new Error(`Environment validation failed:\n${result.errors.join('\n')}`);
  }

  return {
    vars: result.vars,
    sources: result.sources,
  };
}
