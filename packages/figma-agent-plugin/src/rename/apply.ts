import type { RenameItem } from "../shared/types";

export interface ApplyRenameResult {
  applied: number;
  errors: string[];
}

export function applyRenames(items: RenameItem[]): ApplyRenameResult {
  let applied = 0;
  const errors: string[] = [];

  for (const { id, newName } of items) {
    const node = figma.getNodeById(id);
    if (!node || !("name" in node)) {
      errors.push(`Node not found: ${id}`);
      continue;
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      errors.push(`Empty name for ${id}`);
      continue;
    }

    (node as SceneNode).name = trimmed;
    applied++;
  }

  return { applied, errors };
}
