#!/usr/bin/env node
/**
 * Assemble Figma plugin distributable:
 *   releases/figma-agent-plugin-v{version}/
 *     manifest.json
 *     dist/code.js
 *   releases/figma-agent-plugin-v{version}.zip
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PLUGIN_ROOT = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(PLUGIN_ROOT, "../..");
export const RELEASES_DIR = "releases";
export const GITHUB_REPO = "ChinaCarlos/figma-agent-kit";

export function releaseName(version, pkgName = "figma-agent-plugin") {
  return `${pkgName}-v${version}`;
}

export function githubReleaseDownloadUrl(version, zipFileName) {
  const tag = releaseName(version);
  return `https://github.com/${GITHUB_REPO}/releases/download/${tag}/${zipFileName}`;
}

export function assembleRelease(
  pluginRoot = PLUGIN_ROOT,
  repoRoot = REPO_ROOT,
) {
  const pkgPath = path.join(pluginRoot, "package.json");
  const manifestSrc = path.join(pluginRoot, "manifest.json");
  const codeSrc = path.join(pluginRoot, "dist", "code.js");
  const distDir = path.join(pluginRoot, "dist");

  if (!fs.existsSync(codeSrc)) {
    throw new Error("dist/code.js not found — run plugin build first");
  }
  if (!fs.existsSync(manifestSrc)) {
    throw new Error("manifest.json not found");
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const name = releaseName(pkg.version, pkg.name);
  const releasesRoot = path.join(repoRoot, RELEASES_DIR);
  const releaseRoot = path.join(releasesRoot, name);

  const distFiles = fs
    .readdirSync(distDir)
    .filter((n) => n === "code.js" || (!n.endsWith(".map") && !n.endsWith(".html")));
  if (!distFiles.includes("code.js")) {
    throw new Error(`dist/ missing code.js, got: ${distFiles.join(", ")}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestSrc, "utf8"));
  if (manifest.main !== "dist/code.js") {
    throw new Error(`manifest.main must be "dist/code.js", got "${manifest.main}"`);
  }

  fs.rmSync(releaseRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(releaseRoot, "dist"), { recursive: true });
  fs.writeFileSync(
    path.join(releaseRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  fs.copyFileSync(codeSrc, path.join(releaseRoot, "dist", "code.js"));

  const codeStat = fs.statSync(path.join(releaseRoot, "dist", "code.js"));
  if (codeStat.size <= 0) throw new Error("dist/code.js is empty");

  return {
    version: pkg.version,
    pkgName: pkg.name,
    releaseName: name,
    releaseRoot,
    codeSizeKb: codeStat.size / 1024,
  };
}

export function packageReleaseZip(result, repoRoot = REPO_ROOT) {
  const releasesDir = path.join(repoRoot, RELEASES_DIR);
  const zipFileName = `${result.releaseName}.zip`;
  const zipPath = path.join(releasesDir, zipFileName);

  fs.mkdirSync(releasesDir, { recursive: true });
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // Prefer system zip (available on macOS + ubuntu-latest).
  execFileSync(
    "zip",
    ["-r", "-q", zipPath, result.releaseName],
    { cwd: releasesDir, stdio: "inherit" },
  );

  const zipStat = fs.statSync(zipPath);
  if (zipStat.size <= 0) throw new Error("release zip is empty");

  return {
    zipPath,
    zipFileName,
    zipSizeKb: zipStat.size / 1024,
    downloadUrl: githubReleaseDownloadUrl(result.version, zipFileName),
  };
}

/** Pull bullet notes from a CHANGELOG version section. */
export function notesFromChangelog(changelogPath, version) {
  if (!fs.existsSync(changelogPath)) return [`Figma Agent Kit plugin v${version}`];
  const content = fs.readFileSync(changelogPath, "utf8");
  const header = `## [${version}]`;
  const idx = content.indexOf(header);
  if (idx === -1) return [`Figma Agent Kit plugin v${version}`];

  const after = content.slice(idx);
  const nextHeader = after.search(/\n## \[/);
  const nextLinks = after.search(/\n\[[^\]]+\]:\s+https?:\/\//);
  const ends = [nextHeader, nextLinks].filter((n) => n !== -1);
  const end = ends.length ? Math.min(...ends) : after.length;
  const section = after.slice(0, end);

  const bullets = [...section.matchAll(/^- (.+)$/gm)].map((m) => m[1].trim());
  return bullets.length ? bullets : [`Figma Agent Kit plugin v${version}`];
}

export function writeVersionManifest(result, zip, repoRoot = REPO_ROOT, notes) {
  const versionPath = path.join(repoRoot, RELEASES_DIR, "version.json");
  const changelogPath = path.join(PLUGIN_ROOT, "CHANGELOG.md");
  const manifest = {
    latest: result.version,
    releasedAt: new Date().toISOString().slice(0, 10),
    notes: notes ?? notesFromChangelog(changelogPath, result.version),
    downloadUrl: zip.downloadUrl,
    zipFileName: zip.zipFileName,
    tag: result.releaseName,
  };
  fs.mkdirSync(path.dirname(versionPath), { recursive: true });
  fs.writeFileSync(versionPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { versionPath, manifest };
}

export async function buildReleaseArtifacts(pluginRoot = PLUGIN_ROOT, repoRoot = REPO_ROOT) {
  const assembled = assembleRelease(pluginRoot, repoRoot);
  const zip = packageReleaseZip(assembled, repoRoot);
  const versionManifest = writeVersionManifest(assembled, zip, repoRoot);
  return { ...assembled, ...zip, versionManifest };
}

export function printReleaseSummary(result) {
  console.log("");
  console.log("[plugin-release] distributable ready:");
  console.log(`[plugin-release]   dir  ${RELEASES_DIR}/${result.releaseName}/`);
  console.log(`[plugin-release]   zip  ${RELEASES_DIR}/${result.zipFileName} (${result.zipSizeKb.toFixed(1)} KB)`);
  console.log(`[plugin-release]   url  ${result.downloadUrl}`);
  console.log(
    `[plugin-release]   version.json latest=${result.versionManifest.manifest.latest}`,
  );
  console.log("");
  console.log(
    "[plugin-release] Install in Figma: Plugins → Development → Import plugin from manifest…",
  );
  console.log(
    `[plugin-release]   use unzipped ${RELEASES_DIR}/${result.releaseName}/manifest.json`,
  );
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const result = await buildReleaseArtifacts();
  printReleaseSummary(result);
}
