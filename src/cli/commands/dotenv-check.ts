import fs from "fs";
import path from "path";
import { Command } from "commander";

export interface DotenvCheckResult {
  file: string;
  exists: boolean;
  inGitignore: boolean;
  inGitignorePath: string | null;
  warning: string | null;
}

export function findGitignore(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, ".gitignore");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function checkDotenvFile(filePath: string): DotenvCheckResult {
  const absPath = path.resolve(filePath);
  const exists = fs.existsSync(absPath);
  const gitignorePath = findGitignore(path.dirname(absPath));

  let inGitignore = false;
  if (gitignorePath) {
    const content = fs.readFileSync(gitignorePath, "utf8");
    const lines = content.split("\n").map((l) => l.trim());
    const basename = path.basename(absPath);
    inGitignore = lines.some(
      (l) => l === basename || l === `/${basename}` || l === `./${basename}`
    );
  }

  let warning: string | null = null;
  if (exists && !inGitignore) {
    warning = `"${filePath}" exists but is NOT listed in .gitignore — secrets may be committed.`;
  } else if (!exists) {
    warning = `"${filePath}" does not exist.`;
  }

  return {
    file: filePath,
    exists,
    inGitignore,
    inGitignorePath: gitignorePath,
    warning,
  };
}

export function buildDotenvCheckCommand(): Command {
  return new Command("dotenv-check")
    .description("Check whether .env files exist and are git-ignored")
    .argument("[files...]")
    .option("--json", "Output as JSON")
    .action((files: string[], opts: { json?: boolean }) => {
      const targets = files.length > 0 ? files : [".env"];
      const results = targets.map(checkDotenvFile);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      let hasWarning = false;
      for (const r of results) {
        if (r.warning) {
          console.warn(`⚠️  ${r.warning}`);
          hasWarning = true;
        } else {
          console.log(`✅  "${r.file}" exists and is git-ignored.`);
        }
      }
      if (hasWarning) process.exit(1);
    });
}
