import type { BridgeRequest, BridgeResponse } from "./types";
import { CORE_BRIDGE_TOOLS } from "./types";
import { serializeNode, serializeSelection } from "./serializer";

const LOCAL_FILE_KEY_PREFIX = "local-";

export function getFileKey(): string {
  if (figma.fileKey) return figma.fileKey;
  const stored = figma.root.getPluginData("figmaAgentKit.localFileKey");
  if (stored) return stored;
  const generated = `${LOCAL_FILE_KEY_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  figma.root.setPluginData("figmaAgentKit.localFileKey", generated);
  return generated;
}

function ok(requestId: string, data: unknown): BridgeResponse {
  return { requestId, ok: true, data };
}

function fail(requestId: string, error: string): BridgeResponse {
  return { requestId, ok: false, error };
}

function requireNodes(nodeIds: string[] | undefined, requestId: string): SceneNode[] | BridgeResponse {
  if (!nodeIds?.length) return fail(requestId, "nodeIds is required");
  const nodes: SceneNode[] = [];
  for (const id of nodeIds) {
    const node = figma.getNodeById(id);
    if (!node || !("type" in node)) return fail(requestId, `Node not found: ${id}`);
    nodes.push(node as SceneNode);
  }
  return nodes;
}

function getNodeById(id: string): SceneNode | null {
  const node = figma.getNodeById(id);
  if (!node || !("type" in node)) return null;
  return node as SceneNode;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

async function exportPngBase64(node: ExportMixin): Promise<string> {
  const bytes = await node.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 1 } });
  const chars: string[] = [];
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    chars.push(String.fromCharCode(...bytes.subarray(i, i + chunk)));
  }
  return btoa(chars.join(""));
}

export async function handleBridgeRequest(req: BridgeRequest): Promise<BridgeResponse> {
  const { requestId, tool, nodeIds, params = {} } = req;

  if (!CORE_BRIDGE_TOOLS.includes(tool as (typeof CORE_BRIDGE_TOOLS)[number])) {
    return fail(requestId, `Unsupported tool: ${tool}`);
  }

  try {
    switch (tool) {
      case "get_document": {
        const depth = num(params.depth) ?? 2;
        return ok(requestId, {
          fileKey: getFileKey(),
          fileName: figma.root.name,
          document: serializeNode(figma.root, 0, depth),
        });
      }

      case "get_selection":
        return ok(requestId, {
          fileKey: getFileKey(),
          selection: serializeSelection(figma.currentPage.selection),
        });

      case "get_node": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const depth = num(params.depth) ?? 2;
        return ok(requestId, { nodes: nodes.map((n) => serializeNode(n, 0, depth)) });
      }

      case "get_metadata": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        return ok(requestId, {
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            width: "width" in n ? n.width : undefined,
            height: "height" in n ? n.height : undefined,
          })),
        });
      }

      case "get_design_context": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        return ok(requestId, {
          fileKey: getFileKey(),
          fileName: figma.root.name,
          nodes: nodes.map((n) => serializeNode(n, 0, 3)),
        });
      }

      case "get_screenshot": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const images: { nodeId: string; format: string; data: string }[] = [];
        for (const node of nodes) {
          if (!("exportAsync" in node)) {
            return fail(requestId, `Node ${node.id} (${node.type}) cannot be exported`);
          }
          const data = await exportPngBase64(node as ExportMixin);
          images.push({ nodeId: node.id, format: "png", data });
        }
        return ok(requestId, { images });
      }

      case "set_node_visibility": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const visible = bool(params.visible);
        if (visible === undefined) return fail(requestId, "params.visible (boolean) is required");
        for (const node of nodes) {
          if (!("visible" in node)) return fail(requestId, `Node ${node.id} does not support visibility`);
          node.visible = visible;
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_text_content": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const text = str(params.text);
        if (text === undefined) return fail(requestId, "params.text (string) is required");
        for (const node of nodes) {
          if (node.type !== "TEXT") return fail(requestId, `Node ${node.id} is not TEXT`);
          await figma.loadFontAsync(node.fontName as FontName);
          node.characters = text;
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_node_properties": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        for (const node of nodes) {
          const name = str(params.name);
          if (name !== undefined) node.name = name;
          if ("x" in node && num(params.x) !== undefined) node.x = num(params.x)!;
          if ("y" in node && num(params.y) !== undefined) node.y = num(params.y)!;
          if ("opacity" in node && num(params.opacity) !== undefined) node.opacity = num(params.opacity)!;
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "create_frame": {
        const frame = figma.createFrame();
        const name = str(params.name);
        if (name) frame.name = name;
        if (num(params.x) !== undefined) frame.x = num(params.x)!;
        if (num(params.y) !== undefined) frame.y = num(params.y)!;
        if (num(params.width) !== undefined) frame.resize(num(params.width)!, frame.height);
        if (num(params.height) !== undefined) frame.resize(frame.width, num(params.height)!);
        const parentId = str(params.parentId);
        if (parentId) {
          const parent = getNodeById(parentId);
          if (!parent || !("appendChild" in parent)) {
            return fail(requestId, `Invalid parentId: ${parentId}`);
          }
          (parent as ChildrenMixin).appendChild(frame);
        } else {
          figma.currentPage.appendChild(frame);
        }
        return ok(requestId, { node: serializeNode(frame, 0, 0) });
      }

      case "create_text": {
        const textNode = figma.createText();
        const family = str(params.fontFamily) ?? "Inter";
        const style = str(params.fontStyle) ?? "Regular";
        await figma.loadFontAsync({ family, style });
        textNode.fontName = { family, style };
        const text = str(params.text) ?? "";
        textNode.characters = text;
        const name = str(params.name);
        if (name) textNode.name = name;
        if (num(params.x) !== undefined) textNode.x = num(params.x)!;
        if (num(params.y) !== undefined) textNode.y = num(params.y)!;
        const parentId = str(params.parentId);
        if (parentId) {
          const parent = getNodeById(parentId);
          if (!parent || !("appendChild" in parent)) {
            return fail(requestId, `Invalid parentId: ${parentId}`);
          }
          (parent as ChildrenMixin).appendChild(textNode);
        } else {
          figma.currentPage.appendChild(textNode);
        }
        return ok(requestId, { node: serializeNode(textNode, 0, 0) });
      }

      case "group_nodes": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        if (nodes.length < 1) return fail(requestId, "At least one node is required to group");
        const group = figma.group(nodes, nodes[0].parent as BaseNode & ChildrenMixin);
        const name = str(params.name);
        if (name) group.name = name;
        return ok(requestId, { node: serializeNode(group, 0, 1) });
      }

      case "ungroup_node": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const ungrouped: string[] = [];
        for (const node of nodes) {
          if (node.type !== "GROUP") return fail(requestId, `Node ${node.id} is not a GROUP`);
          const parent = node.parent;
          if (!parent || !("appendChild" in parent)) {
            return fail(requestId, `Cannot ungroup ${node.id}: invalid parent`);
          }
          const children = [...node.children];
          for (const child of children) {
            (parent as ChildrenMixin).appendChild(child);
          }
          node.remove();
          ungrouped.push(...children.map((c) => c.id));
        }
        return ok(requestId, { ungrouped });
      }

      case "duplicate_nodes": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const copies: SerializedNode[] = [];
        for (const node of nodes) {
          const clone = node.clone();
          const parent = node.parent;
          if (parent && "appendChild" in parent) {
            (parent as ChildrenMixin).appendChild(clone);
            if ("x" in clone && "x" in node) clone.x = node.x + 20;
            if ("y" in clone && "y" in node) clone.y = node.y + 20;
          }
          copies.push(serializeNode(clone, 0, 0));
        }
        return ok(requestId, { nodes: copies });
      }

      case "reparent_nodes": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const parentId = str(params.parentId);
        if (!parentId) return fail(requestId, "params.parentId is required");
        const parent = getNodeById(parentId);
        if (!parent || !("appendChild" in parent)) {
          return fail(requestId, `Invalid parentId: ${parentId}`);
        }
        const index = num(params.index);
        for (const node of nodes) {
          if (index !== undefined && "insertChild" in parent) {
            (parent as ChildrenMixin).insertChild(index, node);
          } else {
            (parent as ChildrenMixin).appendChild(node);
          }
        }
        return ok(requestId, { reparented: nodes.map((n) => n.id), parentId });
      }

      case "set_selection": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        figma.currentPage.selection = nodes;
        return ok(requestId, { selection: nodes.map((n) => n.id) });
      }

      case "scroll_and_zoom_into_view": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        return ok(requestId, { focused: nodes.map((n) => n.id) });
      }

      case "delete_nodes": {
        const nodes = requireNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const deleted = nodes.map((n) => n.id);
        for (const node of nodes) node.remove();
        return ok(requestId, { deleted });
      }

      case "get_styles": {
        const styles = await figma.getLocalPaintStylesAsync();
        const textStyles = await figma.getLocalTextStylesAsync();
        const effectStyles = await figma.getLocalEffectStylesAsync();
        return ok(requestId, {
          paintStyles: styles.map((s) => ({ id: s.id, name: s.name, key: s.key })),
          textStyles: textStyles.map((s) => ({ id: s.id, name: s.name, key: s.key })),
          effectStyles: effectStyles.map((s) => ({ id: s.id, name: s.name, key: s.key })),
        });
      }

      case "get_variable_defs": {
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        const variables = await figma.variables.getLocalVariablesAsync();
        return ok(requestId, {
          collections: collections.map((c) => ({
            id: c.id,
            name: c.name,
            modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
          })),
          variables: variables.map((v) => ({
            id: v.id,
            name: v.name,
            resolvedType: v.resolvedType,
            collectionId: v.variableCollectionId,
          })),
        });
      }

      default:
        return fail(requestId, `Unsupported tool: ${tool}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return fail(requestId, message);
  }
}
