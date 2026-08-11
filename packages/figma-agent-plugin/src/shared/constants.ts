/**
 * Bridge port shared by plugin main. The UI reads the same value via
 * `__BRIDGE_PORT__` injected at build time from /bridge.config.json.
 * Do not hardcode a port — change bridge.config.json and rebuild.
 */
export { DEFAULT_BRIDGE_PORT as BRIDGE_PORT } from "./bridge-port.generated";

export const UI_SIZE = {
  normal: { width: 732, height: 580 },
  mini: { width: 300, height: 118 },
  min: { width: 560, height: 420 },
  max: { width: 1200, height: 900 },
} as const;

export const SETTINGS_STORAGE_KEY = "figmaAgentKit.settings";
export const PROMPT_OVERRIDES_STORAGE_KEY = "figmaAgentKit.promptOverrides";

export const DEFAULT_API_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-4o";
