import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = resolve(rootDir, "src", "buildVersion.js");
const publicFile = resolve(rootDir, "public", "version.json");

const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.COMMIT_SHA ||
  "";
const timestamp = new Date().toISOString();
const version = commit ? commit.slice(0, 12) : timestamp;
const payload = {
  version,
  commit: commit || null,
  builtAt: timestamp,
};

mkdirSync(dirname(sourceFile), { recursive: true });
mkdirSync(dirname(publicFile), { recursive: true });

writeFileSync(
  sourceFile,
  `export const APP_VERSION = ${JSON.stringify(version)};\nexport const APP_BUILT_AT = ${JSON.stringify(timestamp)};\n`,
);

writeFileSync(publicFile, `${JSON.stringify(payload, null, 2)}\n`);
