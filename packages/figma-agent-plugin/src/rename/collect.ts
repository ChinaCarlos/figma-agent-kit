import type { RenameCandidate } from "../shared/types";

const MIN_DIMENSION = 2;
const SKIP_TYPES = new Set(["TEXT"]);

function nodeBounds(node: SceneNode): { x: number; y: number; width: number; height: number } {
  if ("width" in node && "height" in node) {
    return {
      x: "x" in node ? node.x : 0,
      y: "y" in node ? node.y : 0,
      width: node.width,
      height: node.height,
    };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

export function collectRenameCandidates(root: SceneNode): RenameCandidate[] {
  const candidates: RenameCandidate[] = [];

  function visit(node: SceneNode): void {
    if (node.id === root.id) {
      if ("children" in node) {
        for (const child of node.children) visit(child);
      }
      return;
    }

    if (SKIP_TYPES.has(node.type)) return;

    const { x, y, width, height } = nodeBounds(node);
    if (width < MIN_DIMENSION && height < MIN_DIMENSION) return;

    candidates.push({
      id: node.id,
      name: node.name,
      type: node.type,
      x,
      y,
      width,
      height,
    });

    if ("children" in node) {
      for (const child of node.children) visit(child);
    }
  }

  visit(root);
  return candidates;
}
