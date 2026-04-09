import { EnvSchema, ValidationResult, ValidationError, ValidationWarning } from './types';

const URL_REGEX = /^https?:\/\/.+/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnv(
  schema: EnvSchema,
  env: Record<string, string | undefined>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (const [key, definition] of Object.entries(schema)) {
    const rawValue = env[key];

    if (rawValue === undefined || rawValue === '') {
      if (definition.required !== false && definition.default === undefined) {
        errors.push({ key, message: `Missing required environment variable "${key}"` });
      } else if (definition.default !== undefined) {
        warnings.push({ key, message: `"${key}" not set, using default: ${definition.default}` });
      }
      continue;
    }

    switch (definition.type) {
      case 'number':
        if (isNaN(Number(rawValue))) {
          errors.push({ key, message: `"${key}" must be a valid number, got "${rawValue}"` });
        }
        break;
      case 'boolean':
        if (!['true', 'false', '1', '0'].includes(rawValue.toLowerCase())) {
          errors.push({ key, message: `"${key}" must be a boolean (true/false/1/0), got "${rawValue}"` });
        }
        break;
      case 'url':
        if (!URL_REGEX.test(rawValue)) {
          errors.push({ key, message: `"${key}" must be a valid URL, got "${rawValue}"` });
        }
        break;
      case 'email':
        if (!EMAIL_REGEX.test(rawValue)) {
          errors.push({ key, message: `"${key}" must be a valid email, got "${rawValue}"` });
        }
        break;
      case 'string':
        if (definition.pattern && !new RegExp(definition.pattern).test(rawValue)) {
          errors.push({ key, message: `"${key}" does not match pattern "${definition.pattern}"` });
        }
        break;
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
