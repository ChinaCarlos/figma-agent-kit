import type { GroupPlan, GroupPlanItem } from "../shared/types";

export interface ApplyGroupResult {
  groupsCreated: number;
  errors: string[];
}

function applyLevel(parent: ChildrenMixin, items: GroupPlanItem[]): { created: number; errors: string[] } {
  let created = 0;
  const errors: string[] = [];

  for (const item of items) {
    const nodes: SceneNode[] = [];
    for (const id of item.nodeIds) {
      const node = figma.getNodeById(id);
      if (!node) {
        errors.push(`Node not found: ${id}`);
        continue;
      }
      if (node.parent !== parent) {
        errors.push(`Node ${id} is not a direct child of the target parent`);
        continue;
      }
      nodes.push(node as SceneNode);
    }

    if (nodes.length === 0) continue;

    const group = figma.group(nodes, parent as BaseNode & ChildrenMixin);
    group.name = (item.name || "Group").trim() || "Group";
    created++;

    if (item.subGroups?.length) {
      const nested = applyLevel(group, item.subGroups);
      created += nested.created;
      errors.push(...nested.errors);
    }
  }

  return { created, errors };
}

export function applyGroupPlan(rootId: string, plan: GroupPlan): ApplyGroupResult {
  const root = figma.getNodeById(rootId);
  if (!root || !("children" in root)) {
    return { groupsCreated: 0, errors: [`Root not found or not groupable: ${rootId}`] };
  }

  const result = applyLevel(root as ChildrenMixin, plan.groups ?? []);
  return { groupsCreated: result.created, errors: result.errors };
}
