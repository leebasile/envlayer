import { PinResult } from "./pin";

export interface PinVerifyResult {
  valid: boolean;
  expected: string;
  actual: string;
}

export function formatPinText(result: PinResult): string {
  const lines: string[] = [
    `File:      ${result.file}`,
    `Hash:      ${result.hash}`,
    `Keys:      ${result.keys}`,
    `Pinned at: ${result.pinnedAt}`,
  ];
  return lines.join("\n");
}

export function formatPinJson(result: PinResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatPinSummary(result: PinResult): string {
  return `Pinned ${result.keys} key(s) with hash ${result.hash.slice(0, 12)}...`;
}

export function formatVerifyText(result: PinVerifyResult, file: string): string {
  if (result.valid) {
    return `✔ ${file} matches pinned hash (${result.expected.slice(0, 12)}...)`;
  }
  return [
    `✘ ${file} hash mismatch`,
    `  expected: ${result.expected}`,
    `  actual:   ${result.actual}`,
  ].join("\n");
}

export function formatVerifyJson(result: PinVerifyResult): string {
  return JSON.stringify(result, null, 2);
}
