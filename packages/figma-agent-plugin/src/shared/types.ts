export interface PluginSettings {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  dismissedVersion?: string;
}

export interface RenameCandidate {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenameItem {
  id: string;
  newName: string;
}

export interface GroupCandidate {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SuggestedCluster {
  name: string;
  nodeIds: string[];
}

export interface GroupPlanItem {
  name: string;
  nodeIds: string[];
  subGroups?: GroupPlanItem[];
}

export interface GroupPlan {
  groups: GroupPlanItem[];
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
  | { type: "setSettings"; settings: PluginSettings }
  | { type: "startRename" }
  | { type: "renameResult"; items: RenameItem[]; cloneRootId: string }
  | { type: "startGroup" }
  | { type: "groupApply"; plan: GroupPlan; cloneRootId: string };

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
  | { type: "settings"; settings: PluginSettings }
  | { type: "pluginVersion"; version: string }
  | {
      type: "aiRenameRequest";
      png: number[];
      candidates: RenameCandidate[];
      cloneRootId: string;
    }
  | {
      type: "aiGroupRequest";
      png: number[];
      candidates: GroupCandidate[];
      suggestedClusters?: SuggestedCluster[];
      cloneRootId: string;
    }
  | { type: "renameDone"; cloneRootId: string; items: RenameItem[] }
  | { type: "groupDone"; cloneRootId: string; plan: GroupPlan };

export interface SerializedSelectionItem {
  id: string;
  name: string;
  type: string;
}
