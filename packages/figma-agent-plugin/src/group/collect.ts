import type { GroupCandidate, SuggestedCluster } from "../shared/types";

type GroupableRoot = FrameNode | GroupNode | SectionNode;

export interface GroupCollectResult {
  candidates: GroupCandidate[];
  suggestedClusters: SuggestedCluster[];
}

function toCandidate(node: SceneNode): GroupCandidate {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    x: "x" in node ? node.x : 0,
    y: "y" in node ? node.y : 0,
    width: "width" in node ? node.width : 0,
    height: "height" in node ? node.height : 0,
  };
}

function suggestClustersByProximity(candidates: GroupCandidate[]): SuggestedCluster[] {
  if (candidates.length < 2) return [];

  const sorted = [...candidates].sort((a, b) => a.y - b.y || a.x - b.x);
  const clusters: SuggestedCluster[] = [];
  const rowThreshold = 24;
  let row: GroupCandidate[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = row[row.length - 1];
    const cur = sorted[i];
    if (Math.abs(cur.y - prev.y) <= rowThreshold) {
      row.push(cur);
    } else {
      if (row.length >= 2) {
        clusters.push({
          name: `Row ${clusters.length + 1}`,
          nodeIds: row.map((c) => c.id),
        });
      }
      row = [cur];
    }
  }

  if (row.length >= 2) {
    clusters.push({
      name: `Row ${clusters.length + 1}`,
      nodeIds: row.map((c) => c.id),
    });
  }

  return clusters;
}

export function collectGroupCandidates(root: GroupableRoot): GroupCollectResult {
  const candidates = root.children.map((child) => toCandidate(child));
  const suggestedClusters = suggestClustersByProximity(candidates);
  return { candidates, suggestedClusters };
}
