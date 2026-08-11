#!/usr/bin/env node
/**
 * figma-agent-mcp release helper
 *
 * Usage (from monorepo root or package dir):
 *   pnpm release:mcp:patch
 *   pnpm release:mcp:minor
 *   pnpm release:mcp:major
 *   cd packages/figma-agent-mcp && node scripts/release.mjs patch --dry-run
 *   cd packages/figma-agent-mcp && node scripts/release.mjs patch --no-git
 *   cd packages/figma-agent-mcp && node scripts/release.mjs patch --publish
 *   cd packages/figma-agent-mcp && node scripts/release.mjs patch --notes "…"
 *
 * Default flow:
 *   1. bump package.json + src/version.ts
 *   2. update CHANGELOG.md
 *   3. pnpm build
 *   4. git commit + annotated tag `figma-agent-mcp-vX.Y.Z` + push
 *      → GitHub Actions publishes npm + creates GitHub Release
 *
 * Options:
 *   --dry-run     print actions only
 *   --no-git      skip commit/tag/push
 *   --no-publish  skip local npm publish (default; CI publishes on tag)
 *   --publish     also run npm publish locally
 *   --notes text  extra CHANGELOG Changed bullet
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(PKG_ROOT, "../..");
const PKG_JSON = path.join(PKG_ROOT, "package.json");
const VERSION_TS = path.join(PKG_ROOT, "src/version.ts");
const CHANGELOG = path.join(PKG_ROOT, "CHANGELOG.md");
const PKG_NAME = "figma-agent-mcp";
const NPM_BASE = `https://www.npmjs.com/package/${PKG_NAME}`;

const BUMP_TYPES = new Set(["patch", "minor", "major"]);

function usage(exitCode = 1) {
  console.log(`Usage: node scripts/release.mjs <patch|minor|major> [options]

Options:
  --dry-run       Preview only (no file writes / git / publish)
  --no-git        Bump + CHANGELOG + build only (no commit/tag/push)
  --no-publish    Do not npm publish locally (default)
  --publish       Also npm publish from this machine
  --notes <text>  Extra CHANGELOG "Changed" note
  -h, --help      Show help
`);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = [...argv];
  /** @type {{ bump: string|null, dryRun: boolean, noGit: boolean, publish: boolean, notes: string }} */
  const opts = {
    bump: null,
    dryRun: false,
    noGit: false,
    publish: false,
    notes: "",
  };

  while (args.length) {
    const a = args.shift();
    if (!a) break;
    if (a === "-h" || a === "--help") usage(0);
    if (a === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (a === "--no-git") {
      opts.noGit = true;
      continue;
    }
    if (a === "--no-publish") {
      opts.publish = false;
      continue;
    }
    if (a === "--publish") {
      opts.publish = true;
      continue;
    }
    if (a === "--notes") {
      opts.notes = args.shift() || "";
      continue;
    }
    if (a.startsWith("--notes=")) {
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

/** @param {string} version @param {'patch'|'minor'|'major'} bump */
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
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function tagName(version) {
  return `${PKG_NAME}-v${version}`;
}

/**
 * @param {string} content
 * @param {string} newVersion
 * @param {string} notes
 */
function updateChangelog(content, newVersion, notes) {
  const date = today();
  const unreleasedHeader = "## [Unreleased]";
  const idx = content.indexOf(unreleasedHeader);
  if (idx === -1) {
    throw new Error('CHANGELOG.md missing "## [Unreleased]" section');
  }

  const afterUnreleased = content.slice(idx + unreleasedHeader.length);
  const nextHeader = afterUnreleased.search(/\n## \[/);
  const unreleasedBody =
    nextHeader === -1
      ? afterUnreleased.trim()
      : afterUnreleased.slice(0, nextHeader).trim();
  const rest =
    nextHeader === -1
      ? ""
      : afterUnreleased.slice(nextHeader).replace(/^\n+/, "");

  const emptyTemplate = [
    "### Added",
    "",
    "### Changed",
    "",
    "### Fixed",
    "",
  ].join("\n");

  const bodyLines = [];
  if (unreleasedBody && unreleasedBody !== emptyTemplate.trim()) {
    bodyLines.push(unreleasedBody);
  }
  if (notes) {
    bodyLines.push(`### Changed\n\n- ${notes}`);
  }
  if (bodyLines.length === 0) {
    bodyLines.push("### Changed\n\n- Routine release");
  }

  const versionBlock = `## [${newVersion}] - ${date}\n\n${bodyLines.join("\n\n")}\n`;
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
    `[Unreleased]: ${NPM_BASE}`,
    `[${newVersion}]: ${NPM_BASE}/v/${newVersion}`,
    "",
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function run(cmd, cwd = PKG_ROOT) {
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
    "[release] Working tree is not clean. Commit/stash other changes first.\n" +
      status,
  );
  process.exit(1);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pkg = JSON.parse(fs.readFileSync(PKG_JSON, "utf8"));
  const oldVersion = pkg.version;
  const newVersion = bumpVersion(
    oldVersion,
    /** @type {'patch'|'minor'|'major'} */ (opts.bump),
  );
  const tag = tagName(newVersion);

  console.log(
    `\n[release] ${PKG_NAME} ${oldVersion} → ${newVersion} (${opts.bump})`,
  );
  if (opts.dryRun) console.log("[release] dry-run mode");
  if (opts.noGit) console.log("[release] git skipped (--no-git)");
  if (opts.publish) console.log("[release] will npm publish locally");
  else console.log("[release] local npm publish skipped (CI publishes on tag)");

  if (!opts.dryRun && !opts.noGit) {
    assertGitClean();
  }

  if (!opts.dryRun) {
    pkg.version = newVersion;
    fs.writeFileSync(PKG_JSON, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log(`[release] wrote package.json version ${newVersion}`);

    fs.writeFileSync(VERSION_TS, `export const VERSION = "${newVersion}";\n`);
    console.log(`[release] wrote src/version.ts`);

    if (!fs.existsSync(CHANGELOG)) {
      throw new Error(`Missing ${CHANGELOG}`);
    }
    const nextLog = updateChangelog(
      fs.readFileSync(CHANGELOG, "utf8"),
      newVersion,
      opts.notes,
    );
    fs.writeFileSync(CHANGELOG, nextLog);
    console.log("[release] updated CHANGELOG.md");
  } else {
    console.log(
      `[release] would bump package.json ${oldVersion} → ${newVersion}`,
    );
    console.log("[release] would update src/version.ts + CHANGELOG.md");
  }

  if (!opts.dryRun) {
    run("pnpm run build");
  } else {
    console.log("[release] would run: pnpm run build");
  }

  if (opts.publish && !opts.dryRun) {
    try {
      const who = execSync(
        "npm whoami --registry https://registry.npmjs.org/",
        { cwd: PKG_ROOT, encoding: "utf8" },
      ).trim();
      console.log(`[release] npm user: ${who}`);
    } catch {
      console.error(
        "[release] Not logged in to npm. Run: npm login --registry https://registry.npmjs.org/",
      );
      process.exit(1);
    }
    run("npm publish --access public --registry https://registry.npmjs.org/");
    console.log(`[release] published ${PKG_NAME}@${newVersion}`);
  } else if (opts.dryRun && opts.publish) {
    console.log("[release] would run: npm publish --access public");
  }

  if (!opts.noGit) {
    if (opts.dryRun) {
      console.log(`[release] would git commit + tag ${tag} + push`);
    } else {
      run(
        `git add packages/figma-agent-mcp/package.json packages/figma-agent-mcp/src/version.ts packages/figma-agent-mcp/CHANGELOG.md`,
        REPO_ROOT,
      );
      run(
        `git commit -m "chore(figma-agent-mcp): release v${newVersion}"`,
        REPO_ROOT,
      );
      run(`git tag -a ${tag} -m "${PKG_NAME} v${newVersion}"`, REPO_ROOT);
      run("git push origin HEAD", REPO_ROOT);
      run(`git push origin ${tag}`, REPO_ROOT);
      console.log(`[release] pushed tag ${tag}`);
      console.log(
        "[release] GitHub Actions will build, publish npm, and create the GitHub Release.",
      );
    }
  } else {
    console.log(`\n[release] done without git. Next:`);
    console.log(
      `  git add packages/figma-agent-mcp && git commit -m "chore(figma-agent-mcp): release v${newVersion}"`,
    );
    console.log(`  git tag -a ${tag} -m "${PKG_NAME} v${newVersion}"`);
    console.log(`  git push origin HEAD ${tag}`);
  }

  console.log(`\n[release] ${NPM_BASE}`);
  console.log(`Cursor mcp.json:`);
  console.log(
    `  "${PKG_NAME}": { "command": "npx", "args": ["-y", "${PKG_NAME}"] }`,
  );
}

main();
