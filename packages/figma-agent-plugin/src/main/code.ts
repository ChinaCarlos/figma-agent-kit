import { handleBridgeRequest, getFileKey } from "../bridge/handlers";
import {
  collectExportableSelection,
  collectExportPreviewNodes,
  exportNodeAsSlicePng,
  exportNodesByIdAsSlices,
  sanitizeExportBaseName,
  sanitizeExportFileName,
} from "../export/slices";
import { applyGroupPlan } from "../group/apply";
import { collectGroupCandidates } from "../group/collect";
import { applyRenames } from "../rename/apply";
import { collectRenameCandidates } from "../rename/collect";
import {
  BRIDGE_PORT,
  EXPORT_PREVIEW_SCALE,
  EXPORT_SLICE_SCALE,
  PROMPT_OVERRIDES_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  UI_SIZE,
} from "../shared/constants";
import type {
  GroupPlan,
  PluginMessage,
  PluginSettings,
  PromptOverrides,
  SerializedSelectionItem,
  UIMessage,
} from "../shared/types";

let activePreviewRequestId: number | null = null;

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
  // Cancel in-flight 1× preview when selection changes.
  activePreviewRequestId = null;
  const msg: PluginMessage = {
    type: "selectionChange",
    selection: serializeSelectionItems(),
    exportNodes: collectExportPreviewNodes(figma.currentPage.selection),
    fileKey: getFileKey(),
    fileName: figma.root.name,
  };
  figma.ui.postMessage(msg);
}

async function handleExportSlices(requestId: number): Promise<void> {
  activePreviewRequestId = requestId;
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    postError("Select layers to export first.");
    figma.ui.postMessage({
      type: "exportSlicesDone",
      requestId,
      loaded: 0,
      total: 0,
      skipped: [],
    } satisfies PluginMessage);
    return;
  }

  const { nodes, skipped } = collectExportableSelection(selection);
  const total = nodes.length;
  postStatus(`Loading slice preview (${EXPORT_PREVIEW_SCALE}×) · ${total}`);

  if (total === 0) {
    figma.ui.postMessage({
      type: "exportSlicesDone",
      requestId,
      loaded: 0,
      total: 0,
      skipped,
    } satisfies PluginMessage);
    return;
  }

  let loaded = 0;
  const usedNames = new Set<string>();
  const localSkipped = [...skipped];

  try {
    for (const node of nodes) {
      if (activePreviewRequestId !== requestId) return;
      try {
        const png = await exportNodeAsSlicePng(node, EXPORT_PREVIEW_SCALE);
        const baseName = sanitizeExportBaseName(node.name);
        let fileName = sanitizeExportFileName(node.name, EXPORT_PREVIEW_SCALE);
        if (usedNames.has(fileName)) {
          const stem = fileName.replace(/\.png$/i, "");
          let n = 2;
          while (usedNames.has(`${stem}-${n}.png`)) n += 1;
          fileName = `${stem}-${n}.png`;
        }
        usedNames.add(fileName);
        loaded += 1;
        figma.ui.postMessage({
          type: "exportPreviewItem",
          requestId,
          item: {
            id: node.id,
            name: node.name,
            baseName,
            fileName,
            width: Math.round("width" in node ? node.width : 0),
            height: Math.round("height" in node ? node.height : 0),
            scale: EXPORT_PREVIEW_SCALE,
            png: Array.from(png),
          },
          loaded,
          total,
        } satisfies PluginMessage);
      } catch (err) {
        localSkipped.push({ name: node.name, reason: String(err) });
      }
    }

    if (activePreviewRequestId !== requestId) return;
    postStatus(
      `Preview ready: ${loaded} × ${EXPORT_PREVIEW_SCALE}; download uses ${EXPORT_SLICE_SCALE}×`,
    );
    figma.ui.postMessage({
      type: "exportSlicesDone",
      requestId,
      loaded,
      total,
      skipped: localSkipped,
    } satisfies PluginMessage);
  } catch (err) {
    if (activePreviewRequestId !== requestId) return;
    postError(err instanceof Error ? err.message : String(err));
    figma.ui.postMessage({
      type: "exportSlicesDone",
      requestId,
      loaded,
      total,
      skipped: localSkipped,
    } satisfies PluginMessage);
  }
}

async function handleExportDelivery(
  requestId: number,
  nodeIds: string[],
): Promise<void> {
  if (!nodeIds?.length) {
    figma.ui.postMessage({
      type: "exportDeliveryDone",
      requestId,
      items: [],
      skipped: [{ name: "", reason: "no nodes" }],
    } satisfies PluginMessage);
    return;
  }

  postStatus(`Exporting slices (${EXPORT_SLICE_SCALE}×) · ${nodeIds.length}`);
  try {
    const result = await exportNodesByIdAsSlices(nodeIds, EXPORT_SLICE_SCALE);
    figma.ui.postMessage({
      type: "exportDeliveryDone",
      requestId,
      items: result.items.map((item) => ({
        id: item.id,
        name: item.name,
        baseName: item.baseName,
        fileName: item.fileName,
        width: item.width,
        height: item.height,
        scale: item.scale,
        png: Array.from(item.png),
      })),
      skipped: result.skipped,
    } satisfies PluginMessage);
  } catch (err) {
    figma.ui.postMessage({
      type: "exportDeliveryDone",
      requestId,
      items: [],
      skipped: [{ name: "", reason: String(err) }],
    } satisfies PluginMessage);
  }
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

function normalizePromptOverrides(raw: unknown): PromptOverrides {
  const next: PromptOverrides = {};
  if (!raw || typeof raw !== "object") return next;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.rename === "string") next.rename = obj.rename;
  if (typeof obj.group === "string") next.group = obj.group;
  return next;
}

async function sendPromptOverrides(): Promise<void> {
  const raw = await figma.clientStorage.getAsync(PROMPT_OVERRIDES_STORAGE_KEY);
  figma.ui.postMessage({
    type: "promptOverrides",
    overrides: normalizePromptOverrides(raw),
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
      await sendPromptOverrides();
      break;
    }

    case "resizeWindow": {
      const minW = raw.mini ? UI_SIZE.mini.width : UI_SIZE.min.width;
      const minH = raw.mini ? UI_SIZE.mini.height : UI_SIZE.min.height;
      const width = Math.min(UI_SIZE.max.width, Math.max(minW, raw.width));
      const height = Math.min(UI_SIZE.max.height, Math.max(minH, raw.height));
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

    case "getPromptOverrides": {
      await sendPromptOverrides();
      break;
    }

    case "setPromptOverrides": {
      const overrides = normalizePromptOverrides(raw.overrides);
      await figma.clientStorage.setAsync(PROMPT_OVERRIDES_STORAGE_KEY, overrides);
      await sendPromptOverrides();
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

    case "exportSlices": {
      await handleExportSlices(raw.requestId);
      break;
    }

    case "exportDelivery": {
      await handleExportDelivery(raw.requestId, raw.nodeIds);
      break;
    }

    default:
      break;
  }
};
