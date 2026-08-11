import { handleBridgeRequest, getFileKey } from "../bridge/handlers";
import { applyGroupPlan } from "../group/apply";
import { collectGroupCandidates } from "../group/collect";
import { applyRenames } from "../rename/apply";
import { collectRenameCandidates } from "../rename/collect";
import { BRIDGE_PORT, SETTINGS_STORAGE_KEY, UI_SIZE } from "../shared/constants";
import type {
  GroupPlan,
  PluginMessage,
  PluginSettings,
  SerializedSelectionItem,
  UIMessage,
} from "../shared/types";

figma.showUI(__html__, {
  width: UI_SIZE.normal.width,
  height: UI_SIZE.normal.height,
  themeColors: true,
});

function serializeSelectionItems(): SerializedSelectionItem[] {
  return figma.currentPage.selection.map((node) => ({
    id: node.id,
    name: node.name,
    type: node.type,
  }));
}

function postSelection(): void {
  const msg: PluginMessage = {
    type: "selectionChange",
    selection: serializeSelectionItems(),
    fileKey: getFileKey(),
    fileName: figma.root.name,
  };
  figma.ui.postMessage(msg);
}

function postBridgeStatus(connected: boolean): void {
  const msg: PluginMessage = {
    type: "bridgeStatus",
    connected,
    fileKey: getFileKey(),
    fileName: figma.root.name,
  };
  figma.ui.postMessage(msg);
}

function postLog(level: "info" | "warn" | "error", message: string): void {
  figma.ui.postMessage({ type: "log", level, message } satisfies PluginMessage);
}

function postStatus(message: string): void {
  figma.ui.postMessage({ type: "status", message } satisfies PluginMessage);
}

function postError(message: string): void {
  figma.ui.postMessage({ type: "error", message } satisfies PluginMessage);
}

async function loadSettings(): Promise<PluginSettings> {
  const settings = (await figma.clientStorage.getAsync(SETTINGS_STORAGE_KEY)) as
    | PluginSettings
    | undefined;
  return settings ?? {};
}

async function sendSettings(): Promise<void> {
  const settings = await loadSettings();
  figma.ui.postMessage({
    type: "settings",
    settings,
  } satisfies PluginMessage);
}

function isRenameRoot(node: SceneNode): node is FrameNode | GroupNode {
  return node.type === "FRAME" || node.type === "GROUP";
}

function isGroupRoot(node: SceneNode): node is FrameNode | GroupNode | SectionNode {
  return node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION";
}

function cloneToRight(source: SceneNode): SceneNode {
  const clone = source.clone();
  const parent = source.parent;
  if (parent && "appendChild" in parent) {
    parent.appendChild(clone);
    if ("x" in clone && "y" in clone && "width" in source) {
      clone.x = source.x + source.width + 48;
      clone.y = source.y;
    }
  }
  return clone;
}

async function exportPngBytes(node: ExportMixin): Promise<number[]> {
  const bytes = await node.exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: 1 },
  });
  return Array.from(bytes);
}

figma.on("selectionchange", () => {
  postSelection();
});

figma.ui.onmessage = async (raw: UIMessage) => {
  switch (raw.type) {
    case "ui-ready": {
      // Drive UI WebSocket port from shared constants (synced from bridge.config.json).
      figma.ui.postMessage({
        type: "bridgeConfig",
        port: BRIDGE_PORT,
      } satisfies PluginMessage);
      postSelection();
      postBridgeStatus(false);
      figma.ui.postMessage({
        type: "pluginVersion",
        version: __PLUGIN_VERSION__,
      } satisfies PluginMessage);
      await sendSettings();
      break;
    }

    case "resizeWindow": {
      const width = Math.min(UI_SIZE.max.width, Math.max(UI_SIZE.min.width, raw.width));
      const height = Math.min(UI_SIZE.max.height, Math.max(UI_SIZE.min.height, raw.height));
      figma.ui.resize(width, height);
      break;
    }

    case "openExternal": {
      figma.openExternal(raw.url);
      break;
    }

    case "getSettings": {
      await sendSettings();
      break;
    }

    case "setSettings": {
      await figma.clientStorage.setAsync(SETTINGS_STORAGE_KEY, raw.settings);
      await sendSettings();
      break;
    }

    case "bridge-connected":
      postBridgeStatus(true);
      break;

    case "bridge-disconnected":
      postBridgeStatus(false);
      break;

    case "server-request": {
      const response = await handleBridgeRequest({
        requestId: raw.requestId,
        tool: raw.tool,
        nodeIds: raw.nodeIds,
        params: raw.params,
      });
      figma.ui.postMessage({
        type: "server-response",
        ...response,
      } satisfies PluginMessage);
      break;
    }

    case "startRename": {
      const selection = figma.currentPage.selection;
      if (selection.length !== 1 || !isRenameRoot(selection[0])) {
        postError("Select exactly one Frame or Group to rename.");
        break;
      }

      const settings = await loadSettings();
      if (!settings.apiKey?.trim()) {
        postError("API key is required. Open Settings and add your OpenAI-compatible key.");
        break;
      }

      const source = selection[0];
      postStatus("Cloning selection for AI rename…");
      const clone = cloneToRight(source);

      try {
        const candidates = collectRenameCandidates(clone);
        if (candidates.length === 0) {
          postError("No rename candidates found under the selection.");
          break;
        }

        postStatus(`Exporting preview (${candidates.length} candidates)…`);
        const png = await exportPngBytes(clone);

        figma.ui.postMessage({
          type: "aiRenameRequest",
          png,
          candidates,
          cloneRootId: clone.id,
        } satisfies PluginMessage);
      } catch (err) {
        postError(err instanceof Error ? err.message : String(err));
      }
      break;
    }

    case "renameResult": {
      const items = raw.items;
      const result = applyRenames(items);
      if (result.errors.length) {
        postLog("warn", `Rename warnings: ${result.errors.join("; ")}`);
      }
      postStatus(`Renamed ${result.applied} layer(s).`);

      const clone = figma.getNodeById(raw.cloneRootId);
      if (clone && "type" in clone) {
        figma.currentPage.selection = [clone as SceneNode];
        figma.viewport.scrollAndZoomIntoView([clone as SceneNode]);
      }

      figma.ui.postMessage({
        type: "renameDone",
        cloneRootId: raw.cloneRootId,
        items,
      } satisfies PluginMessage);
      break;
    }

    case "startGroup": {
      const selection = figma.currentPage.selection;
      if (selection.length !== 1 || !isGroupRoot(selection[0])) {
        postError("Select exactly one Frame, Group, or Section to group.");
        break;
      }

      const settings = await loadSettings();
      if (!settings.apiKey?.trim()) {
        postError("API key is required. Open Settings and add your OpenAI-compatible key.");
        break;
      }

      const source = selection[0];
      postStatus("Cloning selection for AI grouping…");
      const clone = cloneToRight(source) as FrameNode | GroupNode | SectionNode;

      try {
        const { candidates, suggestedClusters } = collectGroupCandidates(clone);
        if (candidates.length < 2) {
          postError("Need at least two direct children to suggest groups.");
          break;
        }

        postStatus(`Exporting preview (${candidates.length} children)…`);
        const png = await exportPngBytes(clone);

        figma.ui.postMessage({
          type: "aiGroupRequest",
          png,
          candidates,
          suggestedClusters,
          cloneRootId: clone.id,
        } satisfies PluginMessage);
      } catch (err) {
        postError(err instanceof Error ? err.message : String(err));
      }
      break;
    }

    case "groupApply": {
      const plan = raw.plan;
      const rootId = raw.cloneRootId;
      const result = applyGroupPlan(rootId, plan);
      if (result.errors.length) {
        postLog("warn", `Group warnings: ${result.errors.join("; ")}`);
      }
      postStatus(`Created ${result.groupsCreated} group(s).`);

      const clone = figma.getNodeById(rootId);
      if (clone && "type" in clone) {
        figma.currentPage.selection = [clone as SceneNode];
        figma.viewport.scrollAndZoomIntoView([clone as SceneNode]);
      }

      figma.ui.postMessage({
        type: "groupDone",
        cloneRootId: rootId,
        plan,
      } satisfies PluginMessage);
      break;
    }

    default:
      break;
  }
};
