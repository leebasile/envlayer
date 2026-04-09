/**
 * Represents the structured result of comparing two .env files.
 */
export interface CompareOptions {
  /** Show keys that match between the two files */
  showMatching: boolean;
  /** Output format for the comparison result */
  format: "text" | "json";
}

export interface CompareFileDiff {
  /** Keys present only in the first file */
  onlyInA: string[];
  /** Keys present only in the second file */
  onlyInB: string[];
  /** Keys present in both files but with different values */
  diffValues: Array<{
    key: string;
    valueA: string;
    valueB: string;
  }>;
  /** Keys present in both files with identical values */
  matching: string[];
}

export interface CompareReport {
  fileA: string;
  fileB: string;
  diff: CompareFileDiff;
  totalDifferences: number;
  identical: boolean;
}
