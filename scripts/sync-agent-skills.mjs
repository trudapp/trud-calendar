#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = path.join(REPO_ROOT, "apps", "docs", "public");
const INDEX_PATH = path.join(PUBLIC_ROOT, ".well-known", "agent-skills", "index.json");

const CHECK_MODE = process.argv.includes("--check");

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

const urlToLocalPath = (url) => {
  const wellKnownIdx = url.indexOf("/.well-known/");
  if (wellKnownIdx === -1) {
    throw new Error(`Skill url does not point to a /.well-known/ path: ${url}`);
  }
  return path.join(PUBLIC_ROOT, url.slice(wellKnownIdx + 1));
};

const index = JSON.parse(await readFile(INDEX_PATH, "utf8"));
let drift = false;

for (const skill of index.skills ?? []) {
  if (!skill.url) continue;
  const localPath = urlToLocalPath(skill.url);
  const content = await readFile(localPath);
  const hash = sha256(content);

  if (skill.sha256 !== hash) {
    drift = true;
    if (CHECK_MODE) {
      console.error(`✗ ${skill.name}: sha256 drift`);
      console.error(`  expected: ${hash}`);
      console.error(`  in index: ${skill.sha256}`);
      console.error(`  file:     ${path.relative(REPO_ROOT, localPath)}`);
    } else {
      console.log(`✓ ${skill.name}: ${skill.sha256?.slice(0, 12) ?? "(none)"} → ${hash.slice(0, 12)}`);
      skill.sha256 = hash;
    }
  } else if (!CHECK_MODE) {
    console.log(`= ${skill.name}: ${hash.slice(0, 12)} (already up to date)`);
  }
}

if (CHECK_MODE) {
  if (drift) {
    console.error("\nRun `pnpm sync:agent-skills` to update the index.");
    process.exit(1);
  }
  console.log("✓ All agent-skill hashes match.");
} else if (drift) {
  await writeFile(INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`);
  console.log(`\nUpdated ${path.relative(REPO_ROOT, INDEX_PATH)}`);
}
