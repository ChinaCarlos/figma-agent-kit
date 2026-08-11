import { defineConfig } from "@rsbuild/core";
import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import {
  getPromptRuntimeJs,
  loadPromptTemplates,
} from "./scripts/lib/prompts.mjs";

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

function injectPromptTemplates(html) {
  const marker = "/* __PROMPT_TEMPLATES__ */";
  if (!html.includes(marker)) {
    throw new Error("ui.html prompt templates marker not found");
  }
  const runtimeJs = getPromptRuntimeJs(
    loadPromptTemplates(resolve(__dirname, "src/prompts")),
  );
  return html.replace(marker, () => `${runtimeJs}\n      ${marker}`);
}

function injectLocales(html) {
  const marker = "/* __I18N_LOCALES__ */";
  if (!html.includes(marker)) {
    throw new Error("ui.html i18n locales marker not found");
  }
  const locales = JSON.parse(
    readFileSync(resolve(__dirname, "src/ui/locales.json"), "utf-8"),
  );
  const runtimeJs = `const I18N_LOCALES = ${JSON.stringify(locales)};`;
  return html.replace(marker, () => `${runtimeJs}\n      ${marker}`);
}

function injectJsZip(html) {
  const marker = "<!--FIGMA_AGENT_JSZIP-->";
  if (!html.includes(marker)) {
    throw new Error("ui.html JSZip marker not found");
  }
  const jszipPath = resolve(__dirname, "node_modules/jszip/dist/jszip.min.js");
  const source = readFileSync(jszipPath, "utf-8");
  // Avoid `$&` corruption from String.replace when vendor minified code contains it.
  return html.replace(marker, () => `<script>${source}</script>`);
}

let uiHtml = readFileSync(resolve(__dirname, "src/ui/ui.html"), "utf-8");
uiHtml = injectPromptTemplates(uiHtml);
uiHtml = injectLocales(uiHtml);
uiHtml = injectJsZip(uiHtml);
// Function replacers avoid `$&` / `$n` corruption in minified vendor bundles
// (msgpackr codec contains `$&`; same fix as injectJsZip).
const codecScript = `<script>${bundleUiCodec()}</script>`;
uiHtml = uiHtml
  .replaceAll("__PLUGIN_VERSION__", pkg.version)
  .replaceAll("__VERSION_CHECK_URL__", versionCheckUrl)
  .replaceAll("__BRIDGE_PORT__", String(bridgePort))
  .replace("<!--FIGMA_AGENT_CODEC-->", () => codecScript);

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
  // Figma main-thread sandbox has no `self` / browser HMR client.
  // `rsbuild build --watch` with NODE_ENV=development otherwise injects
  // webpackHotUpdate onto `self` and crashes the plugin on load.
  dev: {
    hmr: false,
    liveReload: false,
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
        // Figma sandbox has neither window nor self; prefer globalThis.
        globalObject: "globalThis",
      },
    },
  },
});
