#!/usr/bin/env node
/**
 * Release MCP + plugin together so versions stay identical.
 *
 *   pnpm release:kit:patch
 *   node scripts/release-kit.mjs minor --notes "…"
 *
 * Flow:
 *   1. bump root + figma-agent-mcp + figma-agent-plugin to the same version
 *   2. update both CHANGELOGs + mcp version.ts
 *   3. build both; assemble plugin ZIP + releases/version.json
 *   4. one git commit + two tags + push
 *      → Release MCP / Release Plugin workflows run in CI
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MCP = path.join(ROOT, "packages/figma-agent-mcp");
const PLUGIN = path.join(ROOT, "packages/figma-agent-plugin");

const BUMP_TYPES = new Set(["patch", "minor", "major"]);

function usage(code = 1) {
  console.log(`Usage: node scripts/release-kit.mjs <patch|minor|major> [--dry-run] [--notes text]
`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = [...argv];
  const opts = { bump: null, dryRun: false, notes: "" };
  while (args.length) {
    const a = args.shift();
    if (a === "-h" || a === "--help") usage(0);
    if (a === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (a === "--notes") {
      opts.notes = args.shift() || "";
      continue;
    }
    if (a?.startsWith("--notes=")) {
      opts.notes = a.slice("--notes=".length);
      continue;
    }
    if (BUMP_TYPES.has(a)) {
      opts.bump = a;
      continue;
    }
    console.error(`Unknown: ${a}`);
    usage(1);
  }
  if (!opts.bump) usage(1);
  return opts;
}

function bumpVersion(version, bump) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) throw new Error(`Invalid semver: ${version}`);
  let major = Number(m[1]);
  let minor = Number(m[2]);
  let patch = Number(m[3]);
  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else patch += 1;
  return `${major}.${minor}.${patch}`;
}

function run(cmd, cwd = ROOT) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`);
}

function assertSameVersions() {
  const root = readJson(path.join(ROOT, "package.json")).version;
  const mcp = readJson(path.join(MCP, "package.json")).version;
  const plugin = readJson(path.join(PLUGIN, "package.json")).version;
  if (root !== mcp || mcp !== plugin) {
    throw new Error(
      `Version mismatch before release: root=${root} mcp=${mcp} plugin=${plugin}`,
    );
  }
  return mcp;
}

function assertGitClean() {
  const status = runCapture("git status --porcelain");
  if (status) {
    console.error("[release-kit] Working tree not clean:\n" + status);
    process.exit(1);
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const oldVersion = assertSameVersions();
  const newVersion = bumpVersion(oldVersion, opts.bump);
  const mcpTag = `figma-agent-mcp-v${newVersion}`;
  const pluginTag = `figma-agent-plugin-v${newVersion}`;
  const note =
    opts.notes ||
    `Kit release v${newVersion} (mcp + plugin versions kept in sync)`;

  console.log(
    `\n[release-kit] ${oldVersion} → ${newVersion} (${opts.bump}) [mcp + plugin]`,
  );
  if (opts.dryRun) {
    console.log("[release-kit] dry-run");
    console.log(`[release-kit] would tag ${mcpTag} + ${pluginTag}`);
    return;
  }

  assertGitClean();

  // Reuse package release helpers without their git steps.
  run(
    `node scripts/release.mjs ${opts.bump} --no-git --notes ${JSON.stringify(note)}`,
    MCP,
  );

  // Plugin script bumps from current plugin version — ensure it still matches oldVersion
  // before this call. MCP --no-git already set mcp to newVersion; plugin is still old.
  // So plugin patch from old → new is correct only if bump type applied to old equals newVersion.
  const pluginBefore = readJson(path.join(PLUGIN, "package.json")).version;
  if (pluginBefore !== oldVersion) {
    throw new Error(
      `Plugin version drifted before plugin bump: expected ${oldVersion}, got ${pluginBefore}`,
    );
  }

  run(
    `node scripts/release.mjs ${opts.bump} --no-git --notes ${JSON.stringify(note)}`,
    PLUGIN,
  );

  // Force-align in case of any drift
  for (const pkgPath of [
    path.join(ROOT, "package.json"),
    path.join(MCP, "package.json"),
    path.join(PLUGIN, "package.json"),
  ]) {
    const pkg = readJson(pkgPath);
    pkg.version = newVersion;
    writeJson(pkgPath, pkg);
  }
  fs.writeFileSync(
    path.join(MCP, "src/version.ts"),
    `export const VERSION = "${newVersion}";\n`,
  );

  const mcpV = readJson(path.join(MCP, "package.json")).version;
  const pluginV = readJson(path.join(PLUGIN, "package.json")).version;
  const rootV = readJson(path.join(ROOT, "package.json")).version;
  if (mcpV !== pluginV || pluginV !== rootV || rootV !== newVersion) {
    throw new Error(
      `Sync failed: root=${rootV} mcp=${mcpV} plugin=${pluginV} want=${newVersion}`,
    );
  }

  run("pnpm build:all");

  run(
    `git add package.json packages/figma-agent-mcp/package.json packages/figma-agent-mcp/src/version.ts packages/figma-agent-mcp/CHANGELOG.md packages/figma-agent-plugin/package.json packages/figma-agent-plugin/CHANGELOG.md releases/version.json`,
  );
  run(`git commit -m "chore: release kit v${newVersion}"`);
  run(`git tag -a ${mcpTag} -m "figma-agent-mcp v${newVersion}"`);
  run(`git tag -a ${pluginTag} -m "figma-agent-plugin v${newVersion}"`);
  run("git push origin HEAD");
  run(`git push origin ${mcpTag} ${pluginTag}`);

  console.log(`\n[release-kit] pushed ${mcpTag} + ${pluginTag}`);
  console.log("[release-kit] CI: npm publish (MCP) + GitHub Release (plugin ZIP)");
  console.log(`[release-kit] versions locked: root=mcp=plugin=${newVersion}`);
}

main();
