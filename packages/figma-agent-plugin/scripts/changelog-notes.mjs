#!/usr/bin/env node
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
  process.stdout.write(`# Figma Agent Kit plugin v${version}\n`);
  process.exit(0);
}
const after = content.slice(idx);
const nextHeader = after.search(/\n## \[/);
const nextLinks = after.search(/\n\[[^\]]+\]:\s+https?:\/\//);
const ends = [nextHeader, nextLinks].filter((n) => n !== -1);
const end = ends.length ? Math.min(...ends) : -1;
const section = (end === -1 ? after : after.slice(0, end)).trim();
process.stdout.write(
  `${section}\n\nDownload the ZIP asset, unzip, then in Figma Desktop:\n` +
    `**Plugins → Development → Import plugin from manifest…** and select \`manifest.json\`.\n`,
);
