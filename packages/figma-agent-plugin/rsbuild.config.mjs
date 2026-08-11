import { defineConfig } from "@rsbuild/core";
import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));
const versionCheckUrl =
  "https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/releases/version.json";

/** Keep MCP / UI / manifest port in sync with /bridge.config.json */
execFileSync(process.execPath, [resolve(root, "scripts/sync-bridge-config.mjs")], {
  stdio: "inherit",
});

const bridgeConfig = JSON.parse(
  readFileSync(resolve(root, "bridge.config.json"), "utf-8"),
);
const bridgePort = Number(bridgeConfig.defaultPort);

/** Bundle MessagePack codec into an IIFE for the plugin UI iframe. */
function bundleUiCodec() {
  const result = esbuild.buildSync({
    entryPoints: [resolve(__dirname, "src/ui/codec.ts")],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: ["es2018"],
    minify: true,
    legalComments: "none",
  });
  return result.outputFiles[0].text;
}

let uiHtml = readFileSync(resolve(__dirname, "src/ui/ui.html"), "utf-8");
uiHtml = uiHtml
  .replaceAll("__PLUGIN_VERSION__", pkg.version)
  .replaceAll("__VERSION_CHECK_URL__", versionCheckUrl)
  .replaceAll("__BRIDGE_PORT__", String(bridgePort))
  .replace(
    "<!--FIGMA_AGENT_CODEC-->",
    `<script>${bundleUiCodec()}</script>`,
  );

export default defineConfig({
  source: {
    entry: {
      code: "./src/main/code.ts",
    },
    define: {
      __html__: JSON.stringify(uiHtml),
      __PLUGIN_VERSION__: JSON.stringify(pkg.version),
      __BRIDGE_PORT__: JSON.stringify(bridgePort),
    },
  },
  output: {
    distPath: {
      root: "dist",
      js: ".",
    },
    filename: {
      js: "code.js",
    },
    cleanDistPath: true,
    legalComments: "none",
  },
  performance: {
    chunkSplit: {
      strategy: "all-in-one",
    },
  },
  tools: {
    rspack: {
      target: "web",
      output: {
        iife: false,
      },
    },
  },
});
