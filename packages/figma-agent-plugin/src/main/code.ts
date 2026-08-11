import { handleBridgeRequest, getFileKey } from "../bridge/handlers";
import { SETTINGS_STORAGE_KEY, UI_SIZE } from "../shared/constants";
import type {
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

figma.on("selectionchange", () => {
  postSelection();
});

figma.ui.onmessage = async (raw: UIMessage) => {
  switch (raw.type) {
    case "ui-ready": {
      postSelection();
      postBridgeStatus(false);
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
      const settings = (await figma.clientStorage.getAsync(SETTINGS_STORAGE_KEY)) as
        | PluginSettings
        | undefined;
      figma.ui.postMessage({
        type: "settings",
        settings: settings ?? {},
      } satisfies PluginMessage);
      break;
    }

    case "setSettings": {
      await figma.clientStorage.setAsync(SETTINGS_STORAGE_KEY, raw.settings);
      figma.ui.postMessage({
        type: "settings",
        settings: raw.settings,
      } satisfies PluginMessage);
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

    default:
      break;
  }
};
