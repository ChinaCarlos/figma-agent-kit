export interface SerializedNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  opacity?: number;
  characters?: string;
  fills?: string;
  children?: SerializedNode[];
}

function summarizeFills(node: GeometryMixin & MinimalBlendMixin): string | undefined {
  if (!("fills" in node) || node.fills === figma.mixed) return undefined;
  const fills = node.fills as readonly Paint[];
  if (!fills.length) return "none";
  return fills
    .slice(0, 3)
    .map((fill) => {
      if (fill.type === "SOLID" && fill.visible !== false) {
        const { r, g, b } = fill.color;
        const a = fill.opacity ?? 1;
        return `solid(rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a}))`;
      }
      return fill.type.toLowerCase();
    })
    .join(", ");
}

export function serializeNode(node: SceneNode, depth = 0, maxDepth = 2): SerializedNode {
  const base: SerializedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
    x: "x" in node ? node.x : 0,
    y: "y" in node ? node.y : 0,
    width: "width" in node ? node.width : 0,
    height: "height" in node ? node.height : 0,
  };

  if ("visible" in node) base.visible = node.visible;
  if ("opacity" in node) base.opacity = node.opacity;
  if (node.type === "TEXT") base.characters = node.characters;

  if ("fills" in node && node.fills !== figma.mixed) {
    const summary = summarizeFills(node as GeometryMixin & MinimalBlendMixin);
    if (summary) base.fills = summary;
  }

  if (depth < maxDepth && "children" in node) {
    const parent = node as ChildrenMixin;
    base.children = parent.children.map((child) => serializeNode(child, depth + 1, maxDepth));
  } else if ("children" in node && (node as ChildrenMixin).children.length > 0) {
    base.children = [
      {
        id: "__truncated__",
        name: `…${(node as ChildrenMixin).children.length} more`,
        type: "TRUNCATED",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    ];
  }

  return base;
}

export function serializeSelection(nodes: readonly SceneNode[]): SerializedNode[] {
  return nodes.map((node) => serializeNode(node, 0, 1));
}
