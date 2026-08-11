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

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function bool(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** Merge nested `properties` into top-level params for schema/handler compatibility. */
function flattenParams(params: Record<string, unknown>): Record<string, unknown> {
  const nested = params.properties;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...params, ...(nested as Record<string, unknown>) };
  }
  return params;
}

/** dynamic-page plugins must use async node lookup. */
async function getNodeById(id: string): Promise<SceneNode | null> {
  const node = await figma.getNodeByIdAsync(id);
  if (!node || !("type" in node)) return null;
  return node as SceneNode;
}

async function resolveNodes(
  nodeIds: string[] | undefined,
  requestId: string,
  options?: { required?: boolean; fallbackSelection?: boolean },
): Promise<SceneNode[] | BridgeResponse> {
  const required = options?.required ?? true;
  const fallbackSelection = options?.fallbackSelection ?? false;

  let ids = nodeIds;
  if ((!ids || ids.length === 0) && fallbackSelection) {
    ids = figma.currentPage.selection.map((n) => n.id);
  }

  if (!ids?.length) {
    return required
      ? fail(requestId, "nodeIds is required (or select nodes in Figma)")
      : [];
  }

  const nodes: SceneNode[] = [];
  for (const id of ids) {
    const node = await getNodeById(id);
    if (!node) return fail(requestId, `Node not found: ${id}`);
    nodes.push(node);
  }
  return nodes;
}

async function appendToParent(
  node: SceneNode,
  parentId: string | undefined,
  requestId: string,
): Promise<BridgeResponse | null> {
  if (parentId) {
    const parent = await getNodeById(parentId);
    if (!parent || !("appendChild" in parent)) {
      return fail(requestId, `Invalid parentId: ${parentId}`);
    }
    (parent as ChildrenMixin).appendChild(node);
  } else {
    figma.currentPage.appendChild(node);
  }
  return null;
}

function normalizeColorChannel(value: number): number {
  // Accept 0–1 or 0–255.
  return value > 1 ? value / 255 : value;
}

function toRGBA(color: unknown): RGBA | null {
  if (!color || typeof color !== "object") return null;
  const c = color as Record<string, unknown>;
  const r = num(c.r);
  const g = num(c.g);
  const b = num(c.b);
  if (r === undefined || g === undefined || b === undefined) return null;
  const a = num(c.a);
  return {
    r: normalizeColorChannel(r),
    g: normalizeColorChannel(g),
    b: normalizeColorChannel(b),
    a: a === undefined ? 1 : normalizeColorChannel(a),
  };
}

function solidPaint(color: RGBA): SolidPaint {
  return {
    type: "SOLID",
    color: { r: color.r, g: color.g, b: color.b },
    opacity: color.a,
  };
}

type ExportFormat = "PNG" | "SVG" | "JPG" | "PDF";

/** Motion API beta — duck-type until @figma/plugin-typings ships MotionNodeMixin. */
function isMotionNode(
  node: SceneNode,
): node is SceneNode & {
  animationStyles: ReadonlyArray<{ id: string }>;
  animations: unknown;
  manualKeyframeTracks: unknown;
  timelines: ReadonlyArray<{ id: string }>;
  applyAnimationStyle: (
    styleId: string,
    animationStyleData?: Record<string, unknown>,
  ) => string;
  removeAnimationStyle: (id: string) => void;
  applyManualKeyframeTrack: (field: unknown, track: unknown) => void;
  removeManualKeyframeTrack: (field: unknown) => void;
  setTimelineDuration: (id: string, duration: number) => void;
} {
  return "applyAnimationStyle" in node;
}

async function exportNodeBytes(
  node: ExportMixin & SceneNode,
  format: ExportFormat,
  scale: number,
  clip: boolean,
): Promise<Uint8Array> {
  const common = clip
    ? { contentsOnly: true, useAbsoluteBounds: true }
    : {};
  const settings: ExportSettings =
    format === "SVG"
      ? { format: "SVG", ...common }
      : format === "PDF"
        ? { format: "PDF", ...common }
        : format === "JPG"
          ? {
              format: "JPG",
              constraint: { type: "SCALE", value: scale },
              ...common,
            }
          : {
              format: "PNG",
              constraint: { type: "SCALE", value: scale },
              ...common,
            };
  return node.exportAsync(settings);
}

function decodeBase64Image(data: string): Uint8Array {
  const base64 = data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function applyGeometry(
  node: SceneNode & LayoutMixin,
  params: Record<string, unknown>,
): void {
  if (num(params.x) !== undefined) node.x = num(params.x)!;
  if (num(params.y) !== undefined) node.y = num(params.y)!;
  const w = num(params.width);
  const h = num(params.height);
  if (w !== undefined || h !== undefined) {
    if ("resize" in node) {
      node.resize(w ?? node.width, h ?? node.height);
    }
  }
  if (num(params.rotation) !== undefined && "rotation" in node) {
    node.rotation = num(params.rotation)!;
  }
}

async function applyTextProperties(
  node: TextNode,
  params: Record<string, unknown>,
): Promise<void> {
  const family = str(params.fontFamily);
  const style = str(params.fontStyle) ?? "Regular";
  if (family) {
    await figma.loadFontAsync({ family, style });
    node.fontName = { family, style };
  } else {
    await figma.loadFontAsync(node.fontName as FontName);
  }

  if (num(params.fontSize) !== undefined) node.fontSize = num(params.fontSize)!;

  if (num(params.letterSpacing) !== undefined) {
    node.letterSpacing = { unit: "PIXELS", value: num(params.letterSpacing)! };
  }

  if (params.lineHeight !== undefined) {
    if (typeof params.lineHeight === "number") {
      node.lineHeight = { unit: "PIXELS", value: params.lineHeight };
    } else if (params.lineHeight && typeof params.lineHeight === "object") {
      node.lineHeight = params.lineHeight as LineHeight;
    }
  }

  const alignH = str(params.textAlignHorizontal);
  if (
    alignH === "LEFT" ||
    alignH === "CENTER" ||
    alignH === "RIGHT" ||
    alignH === "JUSTIFIED"
  ) {
    node.textAlignHorizontal = alignH;
  }

  const alignV = str(params.textAlignVertical);
  if (alignV === "TOP" || alignV === "CENTER" || alignV === "BOTTOM") {
    node.textAlignVertical = alignV;
  }
}

function createShapeNode(shapeType: string): SceneNode {
  switch (shapeType) {
    case "ELLIPSE":
      return figma.createEllipse();
    case "LINE":
      return figma.createLine();
    case "POLYGON":
      return figma.createPolygon();
    case "STAR":
      return figma.createStar();
    case "RECTANGLE":
    default:
      return figma.createRectangle();
  }
}

function mapEffect(raw: Record<string, unknown>): Effect | null {
  const type = str(raw.type);
  if (!type) return null;

  const visible = bool(raw.visible) ?? true;
  const radius = num(raw.radius) ?? 0;
  const color = toRGBA(raw.color) ?? { r: 0, g: 0, b: 0, a: 0.25 };
  const offset =
    raw.offset && typeof raw.offset === "object"
      ? {
          x: num((raw.offset as { x?: unknown }).x) ?? 0,
          y: num((raw.offset as { y?: unknown }).y) ?? 0,
        }
      : { x: 0, y: 0 };

  if (type === "DROP_SHADOW" || type === "INNER_SHADOW") {
    return {
      type,
      color,
      offset,
      radius,
      spread: num(raw.spread) ?? 0,
      visible,
      blendMode: (str(raw.blendMode) as BlendMode) || "NORMAL",
    };
  }

  if (type === "LAYER_BLUR" || type === "BACKGROUND_BLUR") {
    return { type, radius, visible };
  }

  return null;
}

export async function handleBridgeRequest(req: BridgeRequest): Promise<BridgeResponse> {
  const { requestId, tool, nodeIds } = req;
  const params = flattenParams(req.params ?? {});

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
          // Serialize the current page tree (DocumentNode is not a SceneNode).
          document: serializeNode(figma.currentPage as unknown as SceneNode, 0, depth),
        });
      }

      case "get_selection":
        return ok(requestId, {
          fileKey: getFileKey(),
          selection: serializeSelection(figma.currentPage.selection),
        });

      case "get_node": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const depth = num(params.depth) ?? 2;
        return ok(requestId, { nodes: nodes.map((n) => serializeNode(n, 0, depth)) });
      }

      case "get_metadata": {
        const nodes = await resolveNodes(nodeIds, requestId, { fallbackSelection: true });
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
        const nodes = await resolveNodes(nodeIds, requestId, { fallbackSelection: true });
        if (!Array.isArray(nodes)) return nodes;
        return ok(requestId, {
          fileKey: getFileKey(),
          fileName: figma.root.name,
          nodes: nodes.map((n) => serializeNode(n, 0, 3)),
        });
      }

      case "get_screenshot": {
        const nodes = await resolveNodes(nodeIds, requestId, {
          fallbackSelection: true,
        });
        if (!Array.isArray(nodes)) return nodes;
        const formatRaw = str(params.format)?.toUpperCase();
        const format: ExportFormat =
          formatRaw === "SVG" ||
          formatRaw === "PDF" ||
          formatRaw === "JPG" ||
          formatRaw === "PNG"
            ? formatRaw
            : "PNG";
        const scale = num(params.scale) ?? 2;
        const clip = bool(params.clip) === true;
        // `data` is raw bytes — MsgPack encodes as bin (no base64 inflation).
        const images: {
          nodeId: string;
          nodeName: string;
          format: ExportFormat;
          data: Uint8Array;
          width?: number;
          height?: number;
          scale: number;
        }[] = [];
        for (const node of nodes) {
          if (!("exportAsync" in node)) {
            return fail(
              requestId,
              `Node ${node.id} (${node.type}) cannot be exported`,
            );
          }
          const data = await exportNodeBytes(
            node as ExportMixin & SceneNode,
            format,
            scale,
            clip,
          );
          images.push({
            nodeId: node.id,
            nodeName: node.name,
            format,
            data,
            width: "width" in node ? node.width : undefined,
            height: "height" in node ? node.height : undefined,
            scale,
          });
        }
        return ok(requestId, { images });
      }

      case "set_node_visibility": {
        const nodes = await resolveNodes(nodeIds, requestId);
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
        const nodes = await resolveNodes(nodeIds, requestId);
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

      case "set_text_properties": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        for (const node of nodes) {
          if (node.type !== "TEXT") return fail(requestId, `Node ${node.id} is not TEXT`);
          await applyTextProperties(node, params);
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_node_properties": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        for (const node of nodes) {
          const name = str(params.name);
          if (name !== undefined) node.name = name;
          if ("opacity" in node && num(params.opacity) !== undefined) {
            node.opacity = num(params.opacity)!;
          }
          if ("x" in node) applyGeometry(node as SceneNode & LayoutMixin, params);
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_solid_fill": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const color = toRGBA(params.color);
        if (!color) return fail(requestId, "params.color {r,g,b,a?} is required");
        const paint = solidPaint(color);
        for (const node of nodes) {
          if (!("fills" in node)) {
            return fail(requestId, `Node ${node.id} does not support fills`);
          }
          (node as GeometryMixin).fills = [paint];
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_gradient_fill": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;

        const nested =
          params.gradient && typeof params.gradient === "object"
            ? (params.gradient as Record<string, unknown>)
            : {};
        const gradientType =
          str(params.gradientType) ||
          str(nested.type) ||
          "GRADIENT_LINEAR";
        const rawStops = (params.gradientStops || nested.gradientStops) as
          | unknown[]
          | undefined;

        if (!Array.isArray(rawStops) || rawStops.length < 2) {
          return fail(requestId, "gradientStops with at least 2 stops is required");
        }

        const gradientStops: ColorStop[] = [];
        for (const stop of rawStops) {
          if (!stop || typeof stop !== "object") continue;
          const s = stop as Record<string, unknown>;
          const position = num(s.position);
          const color = toRGBA(s.color);
          if (position === undefined || !color) {
            return fail(requestId, "Each gradient stop needs position and color");
          }
          gradientStops.push({ position, color });
        }

        const paint: GradientPaint = {
          type: gradientType as GradientPaint["type"],
          gradientStops,
          gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
          ],
        };

        for (const node of nodes) {
          if (!("fills" in node)) {
            return fail(requestId, `Node ${node.id} does not support fills`);
          }
          (node as GeometryMixin).fills = [paint];
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_effects": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        if (!Array.isArray(params.effects)) {
          return fail(requestId, "params.effects (array) is required");
        }
        const effects: Effect[] = [];
        for (const raw of params.effects) {
          if (!raw || typeof raw !== "object") continue;
          const effect = mapEffect(raw as Record<string, unknown>);
          if (!effect) return fail(requestId, `Unsupported effect type: ${JSON.stringify(raw)}`);
          effects.push(effect);
        }
        for (const node of nodes) {
          if (!("effects" in node)) {
            return fail(requestId, `Node ${node.id} does not support effects`);
          }
          (node as BlendMixin).effects = effects;
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_stroke_properties": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        for (const node of nodes) {
          if (!("strokes" in node)) {
            return fail(requestId, `Node ${node.id} does not support strokes`);
          }
          const geometry = node as GeometryMixin;
          const color = toRGBA(params.color);
          if (color) geometry.strokes = [solidPaint(color)];
          if (num(params.strokeWeight) !== undefined) {
            geometry.strokeWeight = num(params.strokeWeight)!;
          }
          const align = str(params.strokeAlign);
          if (align === "INSIDE" || align === "OUTSIDE" || align === "CENTER") {
            geometry.strokeAlign = align;
          }
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "set_auto_layout": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        for (const node of nodes) {
          if (node.type !== "FRAME" && node.type !== "COMPONENT" && node.type !== "INSTANCE") {
            return fail(requestId, `Node ${node.id} does not support auto-layout`);
          }
          const frame = node as FrameNode;
          const mode = str(params.layoutMode);
          if (mode === "NONE" || mode === "HORIZONTAL" || mode === "VERTICAL") {
            frame.layoutMode = mode;
          }
          if (num(params.paddingLeft) !== undefined) frame.paddingLeft = num(params.paddingLeft)!;
          if (num(params.paddingRight) !== undefined) frame.paddingRight = num(params.paddingRight)!;
          if (num(params.paddingTop) !== undefined) frame.paddingTop = num(params.paddingTop)!;
          if (num(params.paddingBottom) !== undefined) {
            frame.paddingBottom = num(params.paddingBottom)!;
          }
          if (num(params.itemSpacing) !== undefined) frame.itemSpacing = num(params.itemSpacing)!;

          const primary = str(params.primaryAxisAlignItems);
          if (
            primary === "MIN" ||
            primary === "CENTER" ||
            primary === "MAX" ||
            primary === "SPACE_BETWEEN"
          ) {
            frame.primaryAxisAlignItems = primary;
          }

          const counter = str(params.counterAxisAlignItems);
          if (counter === "MIN" || counter === "CENTER" || counter === "MAX" || counter === "BASELINE") {
            frame.counterAxisAlignItems = counter;
          }

          const wrap = str(params.layoutWrap);
          if (wrap === "NO_WRAP" || wrap === "WRAP") {
            frame.layoutWrap = wrap;
          }
        }
        return ok(requestId, { updated: nodes.map((n) => n.id) });
      }

      case "create_frame": {
        const frame = figma.createFrame();
        const name = str(params.name);
        if (name) frame.name = name;
        applyGeometry(frame, params);
        const parentErr = await appendToParent(frame, str(params.parentId), requestId);
        if (parentErr) return parentErr;
        return ok(requestId, { node: serializeNode(frame, 0, 0) });
      }

      case "create_text": {
        const textNode = figma.createText();
        const family = str(params.fontFamily) ?? "Inter";
        const style = str(params.fontStyle) ?? "Regular";
        await figma.loadFontAsync({ family, style });
        textNode.fontName = { family, style };
        textNode.characters = str(params.text) ?? "";
        if (num(params.fontSize) !== undefined) textNode.fontSize = num(params.fontSize)!;
        const name = str(params.name);
        if (name) textNode.name = name;
        applyGeometry(textNode, params);
        const parentErr = await appendToParent(textNode, str(params.parentId), requestId);
        if (parentErr) return parentErr;
        return ok(requestId, { node: serializeNode(textNode, 0, 0) });
      }

      case "create_shape": {
        const shapeType = str(params.shapeType) ?? "RECTANGLE";
        const shape = createShapeNode(shapeType);
        const name = str(params.name);
        if (name) shape.name = name;
        if ("x" in shape) applyGeometry(shape as SceneNode & LayoutMixin, params);
        const parentErr = await appendToParent(shape, str(params.parentId), requestId);
        if (parentErr) return parentErr;
        return ok(requestId, { node: serializeNode(shape, 0, 0) });
      }

      case "create_image": {
        const imageData = str(params.imageData);
        if (!imageData) return fail(requestId, "params.imageData (base64) is required");
        const bytes = decodeBase64Image(imageData);
        const image = figma.createImage(bytes);
        const rect = figma.createRectangle();
        const name = str(params.name) ?? "Image";
        rect.name = name;
        applyGeometry(rect, {
          ...params,
          width: num(params.width) ?? 100,
          height: num(params.height) ?? 100,
        });
        rect.fills = [
          {
            type: "IMAGE",
            scaleMode: "FILL",
            imageHash: image.hash,
          },
        ];
        const parentErr = await appendToParent(rect, str(params.parentId), requestId);
        if (parentErr) return parentErr;
        return ok(requestId, { node: serializeNode(rect, 0, 0), imageHash: image.hash });
      }

      case "group_nodes": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        if (nodes.length < 1) return fail(requestId, "At least one node is required to group");
        const group = figma.group(nodes, nodes[0].parent as BaseNode & ChildrenMixin);
        const name = str(params.name);
        if (name) group.name = name;
        return ok(requestId, { node: serializeNode(group, 0, 1) });
      }

      case "ungroup_node": {
        const nodes = await resolveNodes(nodeIds, requestId);
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
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const copies: ReturnType<typeof serializeNode>[] = [];
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
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const parentId = str(params.parentId);
        if (!parentId) return fail(requestId, "params.parentId is required");
        const parent = await getNodeById(parentId);
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
        const nodes = await resolveNodes(nodeIds, requestId, { required: false });
        if (!Array.isArray(nodes)) return nodes;
        figma.currentPage.selection = nodes;
        return ok(requestId, { selection: nodes.map((n) => n.id) });
      }

      case "scroll_and_zoom_into_view": {
        const nodes = await resolveNodes(nodeIds, requestId, { fallbackSelection: true });
        if (!Array.isArray(nodes)) return nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        return ok(requestId, { focused: nodes.map((n) => n.id) });
      }

      case "delete_nodes": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const deleted = nodes.map((n) => n.id);
        for (const node of nodes) node.remove();
        return ok(requestId, { deleted });
      }

      case "get_motion_styles": {
        const motion = (
          figma as { motion?: { figmaAnimationStyles?: () => unknown } }
        ).motion;
        if (!motion || typeof motion.figmaAnimationStyles !== "function") {
          return fail(
            requestId,
            "figma.motion.figmaAnimationStyles is not available in this Figma version",
          );
        }
        return ok(requestId, { styles: motion.figmaAnimationStyles() });
      }

      case "get_node_motion": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const node = nodes[0];
        if (!node || !isMotionNode(node)) {
          return fail(
            requestId,
            `Node does not support animations: ${node?.id ?? "?"}`,
          );
        }
        return ok(requestId, {
          animationStyles: node.animationStyles,
          animations: node.animations,
          manualKeyframeTracks: node.manualKeyframeTracks,
          timelines: node.timelines,
        });
      }

      case "apply_animation_style": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const node = nodes[0];
        const styleId = str(params.styleId);
        if (!styleId) return fail(requestId, "params.styleId is required");
        if (!node || !isMotionNode(node)) {
          return fail(
            requestId,
            `Node does not support applyAnimationStyle: ${node?.id ?? "?"}`,
          );
        }
        const animationStyleData =
          params.animationStyleData &&
          typeof params.animationStyleData === "object" &&
          !Array.isArray(params.animationStyleData)
            ? (params.animationStyleData as Record<string, unknown>)
            : undefined;
        const appliedStyleId = node.applyAnimationStyle(
          styleId,
          animationStyleData,
        );
        return ok(requestId, {
          nodeId: node.id,
          appliedStyleId,
          animationStyles: node.animationStyles,
        });
      }

      case "remove_animation_style": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const node = nodes[0];
        if (!node || !isMotionNode(node)) {
          return fail(
            requestId,
            `Node does not support removeAnimationStyle: ${node?.id ?? "?"}`,
          );
        }
        const animationStyleId = str(params.animationStyleId);
        if (animationStyleId) {
          node.removeAnimationStyle(animationStyleId);
        } else {
          for (const style of [...(node.animationStyles || [])]) {
            node.removeAnimationStyle(style.id);
          }
        }
        return ok(requestId, {
          nodeId: node.id,
          animationStyles: node.animationStyles,
        });
      }

      case "apply_manual_keyframe_track": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const node = nodes[0];
        const field = params.field;
        const track = params.track;
        if (!field || !track) {
          return fail(requestId, "params.field and params.track are required");
        }
        if (!node || !isMotionNode(node)) {
          return fail(
            requestId,
            `Node does not support applyManualKeyframeTrack: ${node?.id ?? "?"}`,
          );
        }
        node.applyManualKeyframeTrack(field, track);
        return ok(requestId, {
          nodeId: node.id,
          manualKeyframeTracks: node.manualKeyframeTracks,
        });
      }

      case "remove_manual_keyframe_track": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const node = nodes[0];
        const field = params.field;
        if (!field) return fail(requestId, "params.field is required");
        if (!node || !isMotionNode(node)) {
          return fail(
            requestId,
            `Node does not support removeManualKeyframeTrack: ${node?.id ?? "?"}`,
          );
        }
        node.removeManualKeyframeTrack(field);
        return ok(requestId, {
          nodeId: node.id,
          manualKeyframeTracks: node.manualKeyframeTracks,
        });
      }

      case "set_timeline_duration": {
        const nodes = await resolveNodes(nodeIds, requestId);
        if (!Array.isArray(nodes)) return nodes;
        const node = nodes[0];
        const timelineId = str(params.timelineId);
        const duration = num(params.duration);
        if (!timelineId || duration === undefined) {
          return fail(
            requestId,
            "params.timelineId and params.duration are required",
          );
        }
        if (!node || !isMotionNode(node)) {
          return fail(
            requestId,
            `Node does not support setTimelineDuration: ${node?.id ?? "?"}`,
          );
        }
        node.setTimelineDuration(timelineId, duration);
        return ok(requestId, {
          nodeId: node.id,
          timelines: node.timelines,
        });
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
