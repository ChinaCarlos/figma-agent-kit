#!/usr/bin/env node
/**
 * Figma Agent Kit plugin release helper
 *
 *   pnpm release:plugin:patch
 *   cd packages/figma-agent-plugin && node scripts/release.mjs patch --dry-run
 *
 * Flow:
 *   1. bump package.json (+ sync root package.json version)
 *   2. update CHANGELOG.md
 *   3. pnpm build
 *   4. assemble ZIP + releases/version.json
 *   5. git commit + tag figma-agent-plugin-vX.Y.Z + push
 *      → GitHub Actions creates the GitHub Release with the ZIP + notes
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  PLUGIN_ROOT,
  REPO_ROOT,
  buildReleaseArtifacts,
  printReleaseSummary,
  releaseName,
} from "./assemble-release.mjs";

const PKG_JSON = path.join(PLUGIN_ROOT, "package.json");
const ROOT_PKG_JSON = path.join(REPO_ROOT, "package.json");
const CHANGELOG = path.join(PLUGIN_ROOT, "CHANGELOG.md");
const GH_RELEASES = "https://github.com/ChinaCarlos/figma-agent-kit/releases";

const BUMP_TYPES = new Set(["patch", "minor", "major"]);

function usage(code = 1) {
  console.log(`Usage: node scripts/release.mjs <patch|minor|major> [options]

Options:
  --dry-run     Preview only
  --no-git      Bump + build + zip only (no commit/tag/push)
  --notes text  Extra CHANGELOG Changed bullet
  -h, --help
`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = [...argv];
  const opts = { bump: null, dryRun: false, noGit: false, notes: "" };
  while (args.length) {
    const a = args.shift();
    if (a === "-h" || a === "--help") usage(0);
    if (a === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (a === "--no-git") {
      opts.noGit = true;
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
    console.error(`Unknown argument: ${a}`);
    usage(1);
  }
  if (!opts.bump) {
    console.error("Missing bump type: patch | minor | major");
    usage(1);
  }
  return opts;
}

function bumpVersion(version, bump) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
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
  } else {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function updateChangelog(content, newVersion, notes) {
  const unreleasedHeader = "## [Unreleased]";
  const idx = content.indexOf(unreleasedHeader);
  if (idx === -1) throw new Error('CHANGELOG.md missing "## [Unreleased]"');

  const after = content.slice(idx + unreleasedHeader.length);
  const nextHeader = after.search(/\n## \[/);
  const unreleasedBody =
    nextHeader === -1 ? after.trim() : after.slice(0, nextHeader).trim();
  const rest =
    nextHeader === -1 ? "" : after.slice(nextHeader).replace(/^\n+/, "");

  const emptyTemplate = ["### Added", "", "### Changed", "", "### Fixed", ""].join(
    "\n",
  );
  const bodyLines = [];
  if (unreleasedBody && unreleasedBody !== emptyTemplate.trim()) {
    bodyLines.push(unreleasedBody);
  }
  if (notes) bodyLines.push(`### Changed\n\n- ${notes}`);
  if (!bodyLines.length) bodyLines.push("### Changed\n\n- Routine plugin release");

  const versionBlock = `## [${newVersion}] - ${today()}\n\n${bodyLines.join("\n\n")}\n`;
  const preface = content.slice(0, idx).trimEnd();
  const bodyWithoutLinks = rest
    .replace(/\n\[Unreleased\]:[\s\S]*$/m, "\n")
    .trimEnd();

  return [
    preface,
    "",
    unreleasedHeader,
    "",
    emptyTemplate,
    versionBlock,
    bodyWithoutLinks,
    "",
    `[Unreleased]: ${GH_RELEASES}`,
    `[${newVersion}]: ${GH_RELEASES}/tag/${releaseName(newVersion)}`,
    "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function run(cmd, cwd = PLUGIN_ROOT) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function runCapture(cmd, cwd = REPO_ROOT) {
  return execSync(cmd, { cwd, encoding: "utf8" }).trim();
}

function assertGitClean() {
  const status = runCapture("git status --porcelain");
  if (!status) return;
  console.error(
    "[plugin-release] Working tree is not clean. Commit/stash first.\n" + status,
  );
  process.exit(1);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pkg = JSON.parse(fs.readFileSync(PKG_JSON, "utf8"));
  const oldVersion = pkg.version;
  const newVersion = bumpVersion(oldVersion, opts.bump);
  const tag = releaseName(newVersion);

  console.log(
    `\n[plugin-release] figma-agent-plugin ${oldVersion} → ${newVersion} (${opts.bump})`,
  );
  if (opts.dryRun) console.log("[plugin-release] dry-run mode");
  if (opts.noGit) console.log("[plugin-release] git skipped (--no-git)");

  if (!opts.dryRun && !opts.noGit) assertGitClean();

  if (!opts.dryRun) {
    pkg.version = newVersion;
    fs.writeFileSync(PKG_JSON, `${JSON.stringify(pkg, null, 2)}\n`);

    if (fs.existsSync(ROOT_PKG_JSON)) {
      const rootPkg = JSON.parse(fs.readFileSync(ROOT_PKG_JSON, "utf8"));
      rootPkg.version = newVersion;
      fs.writeFileSync(ROOT_PKG_JSON, `${JSON.stringify(rootPkg, null, 2)}\n`);
      console.log(`[plugin-release] synced root package.json → ${newVersion}`);
    }

    const nextLog = updateChangelog(
      fs.readFileSync(CHANGELOG, "utf8"),
      newVersion,
      opts.notes,
    );
    fs.writeFileSync(CHANGELOG, nextLog);
    console.log("[plugin-release] updated CHANGELOG.md");
  } else {
    console.log(`[plugin-release] would bump ${oldVersion} → ${newVersion}`);
  }

  if (!opts.dryRun) {
    run("pnpm run build");
    const artifacts = buildReleaseArtifacts();
    printReleaseSummary(artifacts);
  } else {
    console.log("[plugin-release] would build + assemble ZIP + version.json");
  }

  if (!opts.noGit) {
    if (opts.dryRun) {
      console.log(`[plugin-release] would commit + tag ${tag} + push`);
    } else {
      run(
        `git add packages/figma-agent-plugin/package.json packages/figma-agent-plugin/CHANGELOG.md package.json releases/version.json`,
        REPO_ROOT,
      );
      // Include zip if not gitignored — we gitignore zips; only version.json is committed.
      run(
        `git commit -m "chore(plugin): release v${newVersion}"`,
        REPO_ROOT,
      );
      run(`git tag -a ${tag} -m "figma-agent-plugin v${newVersion}"`, REPO_ROOT);
      run("git push origin HEAD", REPO_ROOT);
      run(`git push origin ${tag}`, REPO_ROOT);
      console.log(`[plugin-release] pushed tag ${tag}`);
      console.log(
        "[plugin-release] GitHub Actions will attach the ZIP to the GitHub Release.",
      );
    }
  } else {
    console.log(`\n[plugin-release] done without git. Next:`);
    console.log(`  git add … && git commit -m "chore(plugin): release v${newVersion}"`);
    console.log(`  git tag -a ${tag} -m "figma-agent-plugin v${newVersion}"`);
    console.log(`  git push origin HEAD ${tag}`);
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
