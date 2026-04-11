export type ConvertFormat = 'dotenv' | 'json' | 'yaml' | 'export';

export interface ConvertOptions {
  input: string;
  output: string;
  from: ConvertFormat;
  to: ConvertFormat;
  overwrite?: boolean;
}

export interface ConvertResult {
  inputFile: string;
  outputFile: string;
  fromFormat: ConvertFormat;
  toFormat: ConvertFormat;
  keysConverted: number;
  success: boolean;
}
