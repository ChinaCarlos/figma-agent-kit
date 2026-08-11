#!/usr/bin/env node
/**
 * Publish figma-agent-mcp to GitHub Packages (npm.pkg.github.com).
 *
 * GitHub Packages requires a scoped name (@OWNER/name). The public npm name
 * stays unscoped (`figma-agent-mcp`); this script temporarily rewrites
 * package.json for the publish, then restores it.
 *
 *   node scripts/publish-github-packages.mjs
 *   OWNER=ChinaCarlos node scripts/publish-github-packages.mjs
 *
 * Auth: NODE_AUTH_TOKEN (GITHUB_TOKEN in Actions, or a PAT with write:packages).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_DIR = path.resolve(__dirname, "..");
const PKG_JSON = path.join(PKG_DIR, "package.json");
const REGISTRY = "https://npm.pkg.github.com";

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: PKG_DIR, stdio: "inherit", env: process.env });
}

function main() {
  const token = process.env.NODE_AUTH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error(
      "[gh-packages] Missing NODE_AUTH_TOKEN / GITHUB_TOKEN (needs packages:write)",
    );
    process.exit(1);
  }

  const owner = (
    process.env.OWNER ||
    process.env.GITHUB_REPOSITORY_OWNER ||
    "ChinaCarlos"
  ).toLowerCase();
  const original = fs.readFileSync(PKG_JSON, "utf8");
  const pkg = JSON.parse(original);
  const scopedName = `@${owner}/${pkg.name.replace(/^@[^/]+\//, "")}`;
  const version = pkg.version;

  console.log(`[gh-packages] ${pkg.name}@${version} → ${scopedName}`);
  console.log(`[gh-packages] registry ${REGISTRY}`);

  const publishPkg = {
    ...pkg,
    name: scopedName,
    publishConfig: {
      ...(pkg.publishConfig || {}),
      access: "public",
      registry: REGISTRY,
    },
  };

  const npmrc = path.join(PKG_DIR, ".npmrc");
  const hadNpmrc = fs.existsSync(npmrc);
  const prevNpmrc = hadNpmrc ? fs.readFileSync(npmrc, "utf8") : null;

  try {
    fs.writeFileSync(PKG_JSON, `${JSON.stringify(publishPkg, null, 2)}\n`);
    // Prefer env-var token expansion so the secret is never written to disk.
    fs.writeFileSync(
      npmrc,
      `@${owner}:registry=${REGISTRY}\n//npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}\n`,
    );
    run(`npm publish --access public --registry ${REGISTRY}`);
    console.log(`[gh-packages] published ${scopedName}@${version}`);
  } finally {
    fs.writeFileSync(PKG_JSON, original);
    if (hadNpmrc) fs.writeFileSync(npmrc, prevNpmrc);
    else if (fs.existsSync(npmrc)) fs.unlinkSync(npmrc);
  }
}

main();
