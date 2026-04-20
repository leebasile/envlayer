export type SchemaFieldType = "string" | "number" | "boolean";

export interface SchemaEntry {
  key: string;
  type: SchemaFieldType;
  required: boolean;
  example?: string;
  description?: string;
}

export interface SchemaAnalysisResult {
  file: string;
  entries: SchemaEntry[];
  totalKeys: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
}
