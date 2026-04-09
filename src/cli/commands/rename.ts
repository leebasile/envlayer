import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

export function renameEnvKey(
  content: string,
  oldKey: string,
  newKey: string
): { content: string; count: number } {
  const lines = content.split("\n");
  let count = 0;

  const updated = lines.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("#") || !trimmed.includes("=")) return line;

    const eqIndex = line.indexOf("=");
    const key = line.substring(0, eqIndex).trim();

    if (key === oldKey) {
      count++;
      const value = line.substring(eqIndex + 1);
      return `${newKey}=${value}`;
    }

    return line;
  });

  return { content: updated.join("\n"), count };
}

export function buildRenameCommand(): Command {
  const cmd = new Command("rename");

  cmd
    .description("Rename an environment variable key in one or more .env files")
    .argument("<old-key>", "The current key name")
    .argument("<new-key>", "The new key name")
    .option("-f, --files <files...>", "Target .env files", [".env"])
    .option("--dry-run", "Preview changes without writing", false)
    .action((oldKey: string, newKey: string, options: { files: string[]; dryRun: boolean }) => {
      let totalCount = 0;

      for (const file of options.files) {
        const filePath = path.resolve(process.cwd(), file);

        if (!fs.existsSync(filePath)) {
          console.warn(`Warning: File not found: ${file}`);
          continue;
        }

        const original = fs.readFileSync(filePath, "utf-8");
        const { content, count } = renameEnvKey(original, oldKey, newKey);

        if (count === 0) {
          console.log(`${file}: key "${oldKey}" not found, skipped.`);
          continue;
        }

        if (options.dryRun) {
          console.log(`${file}: would rename "${oldKey}" → "${newKey}" (${count} occurrence(s))`);
        } else {
          fs.writeFileSync(filePath, content, "utf-8");
          console.log(`${file}: renamed "${oldKey}" → "${newKey}" (${count} occurrence(s))`);
        }

        totalCount += count;
      }

      if (totalCount === 0) {
        console.log(`No occurrences of "${oldKey}" found in any file.`);
      }
    });

  return cmd;
}
