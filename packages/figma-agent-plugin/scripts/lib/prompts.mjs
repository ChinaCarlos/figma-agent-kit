import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROMPT_FILES = {
  rename: "rename.prompt.txt",
  group: "group.prompt.txt",
};

/** @param {string} [promptsDir] */
export function loadPromptTemplates(
  promptsDir = join(__dirname, "../../src/prompts"),
) {
  /** @type {Record<string, string>} */
  const templates = {};
  for (const [key, filename] of Object.entries(PROMPT_FILES)) {
    const filePath = join(promptsDir, filename);
    if (!existsSync(filePath)) {
      throw new Error(`prompt template not found: ${filePath}`);
    }
    templates[key] = readFileSync(filePath, "utf8");
  }
  return templates;
}

/** Inject into ui.html inline script. */
export function getPromptRuntimeJs(templates) {
  return [
    `const PROMPT_TEMPLATES = ${JSON.stringify(templates)};`,
    "function renderPrompt(template, vars) {",
    "  return String(template || '').replace(/\\{\\{(\\w+)\\}\\}/g, function (_, key) {",
    '    return vars[key] != null ? String(vars[key]) : "";',
    "  });",
    "}",
  ].join("\n");
}
