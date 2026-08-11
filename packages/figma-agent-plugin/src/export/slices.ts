import {
  EXPORT_PREVIEW_SCALE,
  EXPORT_SLICE_SCALE,
  MAX_EXPORT_NODES,
} from "../shared/constants";
import type { ExportPreviewNode } from "../shared/types";

export type ExportSliceItem = {
  id: string;
  name: string;
  baseName: string;
  fileName: string;
  width: number;
  height: number;
  png: Uint8Array;
  scale: number;
};

export type ExportSliceSkipped = {
  name: string;
  reason: string;
};

export type ExportSliceResult = {
  items: ExportSliceItem[];
  skipped: ExportSliceSkipped[];
};

export function isExportableNode(node: SceneNode): boolean {
  return (
    "exportAsync" in node &&
    typeof (node as ExportMixin).exportAsync === "function"
  );
}

/** Current selection preview rows (no PNG). */
export function collectExportPreviewNodes(
  selection: readonly SceneNode[],
): ExportPreviewNode[] {
  return selection.map((node) => {
    const w = "width" in node ? node.width : 0;
    const h = "height" in node ? node.height : 0;
    let exportable = isExportableNode(node);
    let skipReason: string | undefined;
    if (!exportable) {
      skipReason = "unsupported";
    } else if (w <= 0 || h <= 0) {
      exportable = false;
      skipReason = "zero-size";
    }
    return {
      id: node.id,
      name: node.name,
      width: Math.round(w),
      height: Math.round(h),
      type: node.type,
      exportable,
      skipReason,
    };
  });
}

export function sanitizeExportBaseName(name: string): string {
  return (
    name
      .trim()
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "") || "layer"
  );
}

export function sanitizeExportFileName(
  name: string,
  scale = EXPORT_SLICE_SCALE,
): string {
  const stem = sanitizeExportBaseName(name);
  const suffix = scale === 1 ? ".png" : `@${scale}x.png`;
  return `${stem}${suffix}`;
}

export async function exportNodeAsSlicePng(
  node: SceneNode,
  scale = EXPORT_SLICE_SCALE,
): Promise<Uint8Array> {
  return (node as ExportMixin).exportAsync({
    format: "PNG",
    constraint: { type: "SCALE", value: scale },
  });
}

function uniqueFileName(baseFileName: string, usedNames: Set<string>): string {
  if (!usedNames.has(baseFileName)) {
    usedNames.add(baseFileName);
    return baseFileName;
  }
  const dot = baseFileName.lastIndexOf(".png");
  const stem = dot > 0 ? baseFileName.slice(0, dot) : baseFileName;
  let n = 2;
  while (usedNames.has(`${stem}-${n}.png`)) n += 1;
  const next = `${stem}-${n}.png`;
  usedNames.add(next);
  return next;
}

export type ExportableSelection = {
  nodes: SceneNode[];
  skipped: ExportSliceSkipped[];
  truncated: boolean;
};

export function collectExportableSelection(
  selection: readonly SceneNode[],
): ExportableSelection {
  const skipped: ExportSliceSkipped[] = [];
  const nodes: SceneNode[] = [];
  let truncated = false;

  if (selection.length > MAX_EXPORT_NODES) {
    truncated = true;
    skipped.push({
      name: `…+${selection.length - MAX_EXPORT_NODES}`,
      reason: `max ${MAX_EXPORT_NODES}`,
    });
  }

  for (const node of selection.slice(0, MAX_EXPORT_NODES)) {
    if (!isExportableNode(node)) {
      skipped.push({ name: node.name, reason: "unsupported" });
      continue;
    }
    const w = "width" in node ? node.width : 0;
    const h = "height" in node ? node.height : 0;
    if (w <= 0 || h <= 0) {
      skipped.push({ name: node.name, reason: "zero-size" });
      continue;
    }
    nodes.push(node);
  }

  return { nodes, skipped, truncated };
}

async function buildSliceItem(
  node: SceneNode,
  scale: number,
  usedNames: Set<string>,
): Promise<ExportSliceItem> {
  const png = await exportNodeAsSlicePng(node, scale);
  const fileName = uniqueFileName(
    sanitizeExportFileName(node.name, scale),
    usedNames,
  );
  return {
    id: node.id,
    name: node.name,
    baseName: sanitizeExportBaseName(node.name),
    fileName,
    width: Math.round("width" in node ? node.width : 0),
    height: Math.round("height" in node ? node.height : 0),
    png,
    scale,
  };
}

/** Export formal slices by node id (default 3×). */
export async function exportNodesByIdAsSlices(
  nodeIds: readonly string[],
  scale = EXPORT_SLICE_SCALE,
): Promise<ExportSliceResult> {
  const items: ExportSliceItem[] = [];
  const skipped: ExportSliceSkipped[] = [];
  const usedNames = new Set<string>();
  const ids = nodeIds.slice(0, MAX_EXPORT_NODES);

  for (const id of ids) {
    const node = await figma.getNodeByIdAsync(id);
    if (
      !node ||
      node.type === "DOCUMENT" ||
      node.type === "PAGE" ||
      !("visible" in node)
    ) {
      skipped.push({ name: id, reason: "missing" });
      continue;
    }
    const scene = node as SceneNode;
    if (!isExportableNode(scene)) {
      skipped.push({ name: scene.name, reason: "unsupported" });
      continue;
    }
    const w = "width" in scene ? scene.width : 0;
    const h = "height" in scene ? scene.height : 0;
    if (w <= 0 || h <= 0) {
      skipped.push({ name: scene.name, reason: "zero-size" });
      continue;
    }
    try {
      items.push(await buildSliceItem(scene, scale, usedNames));
    } catch (err) {
      skipped.push({ name: scene.name, reason: String(err) });
    }
  }

  return { items, skipped };
}

export { EXPORT_PREVIEW_SCALE, EXPORT_SLICE_SCALE };
