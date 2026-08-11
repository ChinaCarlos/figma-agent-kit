export type UiLocale = "zh" | "en";

export interface PluginSettings {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  dismissedVersion?: string;
  /** UI language. Default: zh */
  locale?: UiLocale;
}

export type PromptOverrideKey = "rename" | "group";

export type PromptOverrides = Partial<Record<PromptOverrideKey, string>>;

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

export interface ExportPreviewNode {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  exportable: boolean;
  skipReason?: string;
}

export interface ExportDeliveryItem {
  id: string;
  name: string;
  baseName: string;
  fileName: string;
  width: number;
  height: number;
  scale: number;
  png: number[];
}

export interface ExportSkipped {
  name: string;
  reason: string;
}

export type UIMessage =
  | { type: "ui-ready" }
  | { type: "bridge-connected" }
  | { type: "bridge-disconnected" }
  | { type: "resizeWindow"; width: number; height: number; mini?: boolean }
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
  | { type: "getPromptOverrides" }
  | { type: "setPromptOverrides"; overrides: PromptOverrides }
  | { type: "startRename" }
  | { type: "renameResult"; items: RenameItem[]; cloneRootId: string }
  | { type: "startGroup" }
  | { type: "groupApply"; plan: GroupPlan; cloneRootId: string }
  | { type: "exportSlices"; requestId: number }
  | { type: "exportDelivery"; requestId: number; nodeIds: string[] };

export type PluginMessage =
  | {
      type: "selectionChange";
      selection: SerializedSelectionItem[];
      exportNodes: ExportPreviewNode[];
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
  | { type: "promptOverrides"; overrides: PromptOverrides }
  | { type: "pluginVersion"; version: string }
  | { type: "bridgeConfig"; port: number }
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
  | { type: "groupDone"; cloneRootId: string; plan: GroupPlan }
  | {
      type: "exportPreviewItem";
      requestId: number;
      item: ExportDeliveryItem;
      loaded: number;
      total: number;
    }
  | {
      type: "exportSlicesDone";
      requestId: number;
      loaded: number;
      total: number;
      skipped: ExportSkipped[];
    }
  | {
      type: "exportDeliveryDone";
      requestId: number;
      items: ExportDeliveryItem[];
      skipped: ExportSkipped[];
    };

export interface SerializedSelectionItem {
  id: string;
  name: string;
  type: string;
}
