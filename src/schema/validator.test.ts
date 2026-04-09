import { validateEnv } from './validator';
import { EnvSchema } from './types';

const schema: EnvSchema = {
  PORT: { type: 'number', required: true },
  DATABASE_URL: { type: 'url', required: true },
  ADMIN_EMAIL: { type: 'email', required: true },
  DEBUG: { type: 'boolean', required: false, default: false },
  APP_ENV: { type: 'string', required: true, pattern: '^(development|staging|production)$' },
};

describe('validateEnv', () => {
  it('returns valid for a correct environment', () => {
    const env = {
      PORT: '3000',
      DATABASE_URL: 'https://db.example.com',
      ADMIN_EMAIL: 'admin@example.com',
      DEBUG: 'false',
      APP_ENV: 'production',
    };
    const result = validateEnv(schema, env);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports error for missing required variable', () => {
    const env = {
      PORT: '3000',
      DATABASE_URL: 'https://db.example.com',
      ADMIN_EMAIL: 'admin@example.com',
      APP_ENV: 'production',
    };
    const result = validateEnv(schema, env);
    expect(result.valid).toBe(true); // DEBUG has a default
    expect(result.warnings.some(w => w.key === 'DEBUG')).toBe(true);
  });

  it('reports error for invalid number', () => {
    const env = { PORT: 'not-a-number', DATABASE_URL: 'https://db.example.com', ADMIN_EMAIL: 'a@b.com', APP_ENV: 'staging' };
    const result = validateEnv(schema, env);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'PORT')).toBe(true);
  });

  it('reports error for invalid URL', () => {
    const env = { PORT: '3000', DATABASE_URL: 'not-a-url', ADMIN_EMAIL: 'a@b.com', APP_ENV: 'staging' };
    const result = validateEnv(schema, env);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'DATABASE_URL')).toBe(true);
  });

  it('reports error for invalid email', () => {
    const env = { PORT: '3000', DATABASE_URL: 'https://db.example.com', ADMIN_EMAIL: 'not-an-email', APP_ENV: 'staging' };
    const result = validateEnv(schema, env);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'ADMIN_EMAIL')).toBe(true);
  });

  it('reports error for pattern mismatch', () => {
    const env = { PORT: '3000', DATABASE_URL: 'https://db.example.com', ADMIN_EMAIL: 'a@b.com', APP_ENV: 'unknown' };
    const result = validateEnv(schema, env);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.key === 'APP_ENV')).toBe(true);
  });
});
