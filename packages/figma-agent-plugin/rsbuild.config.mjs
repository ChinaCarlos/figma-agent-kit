import { defineConfig } from "@rsbuild/core";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf-8"));
const versionCheckUrl =
  "https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/releases/version.json";

let uiHtml = readFileSync(resolve(__dirname, "src/ui/ui.html"), "utf-8");
uiHtml = uiHtml
  .replaceAll("__PLUGIN_VERSION__", pkg.version)
  .replaceAll("__VERSION_CHECK_URL__", versionCheckUrl);

export default defineConfig({
  source: {
    entry: {
      code: "./src/main/code.ts",
    },
    define: {
      __html__: JSON.stringify(uiHtml),
      __PLUGIN_VERSION__: JSON.stringify(pkg.version),
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
