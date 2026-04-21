export type EnvFieldType = "string" | "number" | "boolean" | "url" | "email";

export interface EnvFieldSchema {
  type: EnvFieldType;
  required?: boolean;
  default?: string;
  pattern?: string;
  description?: string;
  deprecated?: boolean;
}

export interface EnvSchema {
  version?: string;
  fields: Record<string, EnvFieldSchema>;
}

export interface ValidationError {
  key: string;
  message: string;
}

export interface ValidationWarning {
  key: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
