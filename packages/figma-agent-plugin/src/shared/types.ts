export interface PluginSettings {
  apiBaseUrl?: string;
  apiKey?: string;
}

export type UIMessage =
  | { type: "ui-ready" }
  | { type: "bridge-connected" }
  | { type: "bridge-disconnected" }
  | { type: "resizeWindow"; width: number; height: number }
  | {
      type: "server-request";
      requestId: string;
      tool: string;
      nodeIds?: string[];
      params?: Record<string, unknown>;
    }
  | { type: "openExternal"; url: string }
  | { type: "getSettings" }
  | { type: "setSettings"; settings: PluginSettings };

export type PluginMessage =
  | {
      type: "selectionChange";
      selection: SerializedSelectionItem[];
      fileKey: string;
      fileName: string;
    }
  | {
      type: "bridgeStatus";
      connected: boolean;
      fileKey: string;
      fileName: string;
    }
  | {
      type: "server-response";
      requestId: string;
      ok: boolean;
      data?: unknown;
      error?: string;
    }
  | { type: "log"; level: "info" | "warn" | "error"; message: string }
  | { type: "status"; message: string }
  | { type: "error"; message: string }
  | { type: "settings"; settings: PluginSettings };

export interface SerializedSelectionItem {
  id: string;
  name: string;
  type: string;
}
