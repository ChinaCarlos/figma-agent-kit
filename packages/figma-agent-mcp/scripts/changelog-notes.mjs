#!/usr/bin/env node
/**
 * Print CHANGELOG section for a version (used by GitHub Actions release body).
 * Usage: node scripts/changelog-notes.mjs [version]
 * Default version: package.json version
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const pkg = JSON.parse(
  fs.readFileSync(path.join(PKG_ROOT, "package.json"), "utf8"),
);
const version = process.argv[2] || pkg.version;
const content = fs.readFileSync(path.join(PKG_ROOT, "CHANGELOG.md"), "utf8");
const header = `## [${version}]`;
const idx = content.indexOf(header);
if (idx === -1) {
  process.stdout.write(`Release figma-agent-mcp@${version}\n`);
  process.exit(0);
}
const after = content.slice(idx);
const nextHeader = after.search(/\n## \[/);
const nextLinks = after.search(/\n\[[^\]]+\]:\s+https?:\/\//);
const endCandidates = [nextHeader, nextLinks].filter((n) => n !== -1);
const end = endCandidates.length ? Math.min(...endCandidates) : -1;
const section = (end === -1 ? after : after.slice(0, end)).trim();
process.stdout.write(
  `${section}\n\nnpm: https://www.npmjs.com/package/figma-agent-mcp/v/${version}\n`,
);
