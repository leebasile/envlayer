import fs from "fs";
import path from "path";
import type { Argv } from "yargs";
import type { TemplateResult, TemplateSubstitution, TemplateVariable } from "./template.types";

export function parseEnvFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, "utf-8");
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    map.set(key, value);
  }
  return map;
}

export function extractTemplateVariables(templateContent: string): TemplateVariable[] {
  const pattern = /\{\{\s*([A-Z0-9_]+)(?::([^}]*))?\s*\}\}/g;
  const seen = new Set<string>();
  const variables: TemplateVariable[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(templateContent)) !== null) {
    const key = match[1];
    if (seen.has(key)) continue;
    seen.add(key);
    const defaultValue = match[2]?.trim();
    variables.push({
      key,
      placeholder: match[0],
      defaultValue: defaultValue || undefined,
      required: defaultValue === undefined,
    });
  }
  return variables;
}

export function renderTemplate(
  templateContent: string,
  envMap: Map<string, string>
): TemplateResult {
  const variables = extractTemplateVariables(templateContent);
  const substitutions: TemplateSubstitution[] = [];
  const missingVariables: string[] = [];
  let rendered = templateContent;

  for (const variable of variables) {
    const value = envMap.get(variable.key);
    if (value !== undefined) {
      const pattern = new RegExp(
        `\\{\\{\\s*${variable.key}(?::[^}]*)?\\s*\\}\\}`,
        "g"
      );
      rendered = rendered.replace(pattern, value);
      substitutions.push({
        placeholder: variable.placeholder,
        key: variable.key,
        value,
        usedDefault: false,
      });
    } else if (variable.defaultValue !== undefined) {
      const pattern = new RegExp(
        `\\{\\{\\s*${variable.key}(?::[^}]*)?\\s*\\}\\}`,
        "g"
      );
      rendered = rendered.replace(pattern, variable.defaultValue);
      substitutions.push({
        placeholder: variable.placeholder,
        key: variable.key,
        value: variable.defaultValue,
        usedDefault: true,
      });
    } else {
      missingVariables.push(variable.key);
    }
  }

  return {
    outputFile: "",
    renderedContent: rendered,
    substitutions,
    missingVariables,
  };
}

export function buildTemplateCommand(yargs: Argv): Argv {
  return yargs.command(
    "template <templateFile> <envFile>",
    "Render a template file using values from an env file",
    (y) =>
      y
        .positional("templateFile", { type: "string", demandOption: true })
        .positional("envFile", { type: "string", demandOption: true })
        .option("output", { alias: "o", type: "string", description: "Output file path" })
        .option("format", { choices: ["text", "json"] as const, default: "text" })
        .option("strict", { type: "boolean", default: false, description: "Fail on missing variables" }),
    (argv) => {
      const templateFile = argv.templateFile as string;
      const envFile = argv.envFile as string;
      const outputFile = argv.output as string | undefined;
      const format = argv.format as "text" | "json";
      const strict = argv.strict as boolean;

      const templateContent = fs.readFileSync(templateFile, "utf-8");
      const envMap = parseEnvFile(envFile);
      const result = renderTemplate(templateContent, envMap);
      result.outputFile = outputFile ?? path.basename(templateFile, path.extname(templateFile));

      if (strict && result.missingVariables.length > 0) {
        console.error(`Missing variables: ${result.missingVariables.join(", ")}`);
        process.exit(1);
      }

      if (outputFile) {
        fs.writeFileSync(outputFile, result.renderedContent, "utf-8");
      }

      if (format === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Template: ${templateFile}`);
        console.log(`Env file: ${envFile}`);
        console.log(`Substitutions: ${result.substitutions.length}`);
        if (result.missingVariables.length > 0) {
          console.log(`Missing: ${result.missingVariables.join(", ")}`);
        }
        if (outputFile) {
          console.log(`Written to: ${outputFile}`);
        } else {
          console.log("\n" + result.renderedContent);
        }
      }
    }
  );
}
