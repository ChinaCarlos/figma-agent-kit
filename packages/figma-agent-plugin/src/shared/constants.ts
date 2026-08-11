/**
 * Bridge port shared by plugin main. The UI reads the same value via
 * `__BRIDGE_PORT__` injected at build time from /bridge.config.json.
 * Do not hardcode a port — change bridge.config.json and rebuild.
 */
export { DEFAULT_BRIDGE_PORT as BRIDGE_PORT } from "./bridge-port.generated";

export const UI_SIZE = {
  normal: { width: 440, height: 640 },
  mini: { width: 300, height: 120 },
  min: { width: 280, height: 100 },
  max: { width: 640, height: 900 },
} as const;

export const SETTINGS_STORAGE_KEY = "figmaAgentKit.settings";

export const DEFAULT_API_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-4o";
