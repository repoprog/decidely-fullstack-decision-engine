import dagre from "@dagrejs/dagre";
import { NODE_TYPES } from "../../../constants/decisionTypes";

/**
 * Generates unique DOM-safe IDs for new nodes and edges.
 * Uses timestamp + random slice to avoid collisions after localStorage restore.
 */
export function nextDomId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Breadth-first search to collect all descendant nodes and edges.
 * Used for recursive branch removal.
 */
export function collectDescendants(startId, edges) {
  const set = new Set();
  const q = [startId];
  while (q.length) {
    const id = q.shift();
    if (set.has(id)) continue;
    set.add(id);
    for (const e of edges) {
      if (e.source === id) q.push(e.target);
    }
  }
  return set;
}

/**
 * Calculate node depth relative to the root (0 = root).
 */
export function computeDepthMap(nodes, edges) {
  const hasIncoming = new Set();
  for (const e of edges) hasIncoming.add(e.target);

  const roots = nodes.filter((n) => !hasIncoming.has(n.id));
  if (!roots.length) return new Map();

  const root = roots[0];
  const depth = new Map([[root.id, 0]]);
  const queue = [root.id];
  const outgoing = new Map();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source).push(e.target);
  }

  while (queue.length) {
    const id = queue.shift();
    const d = depth.get(id) ?? 0;
    for (const t of outgoing.get(id) ?? []) {
      if (!depth.has(t)) {
        depth.set(t, d + 1);
        queue.push(t);
      }
    }
  }

  return depth;
}

export function getTreeMaxDepth(depthMap) {
  let m = 0;
  for (const d of depthMap.values()) m = Math.max(m, d);
  return m;
}

/**
 * Assigns stable visible numbers to decision and chance nodes in BFS order.
 */
export function renumberDecisionAndChanceNodes(nodes, edges) {
  const hasIncoming = new Set();
  for (const e of edges) hasIncoming.add(e.target);

  const roots = nodes.filter((n) => !hasIncoming.has(n.id));
  const root = roots[0];
  if (!root) return nodes;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source).push(e);
  }

  const orderedIds = [];
  const visited = new Set();
  const queue = [root.id];

  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const node = byId.get(id);
    if (!node) continue;
    if (node.type === NODE_TYPES.DECISION || node.type === NODE_TYPES.CHANCE) {
      orderedIds.push(id);
    }
    for (const e of outgoing.get(id) ?? []) queue.push(e.target);
  }

  let n = 1;
  const idToNumber = new Map();
  for (const id of orderedIds) idToNumber.set(id, n++);

  return nodes.map((node) => {
    if (node.type !== NODE_TYPES.DECISION && node.type !== NODE_TYPES.CHANCE)
      return node;
    const num = idToNumber.get(node.id) ?? 0;
    return {
      ...node,
      data: { ...node.data, nodeNumber: num },
    };
  });
}

function shiftSubtreeY(nodeMap, startId, edges, deltaY) {
  const descendantIds = collectDescendants(startId, edges);

  for (const id of descendantIds) {
    const node = nodeMap.get(id);
    if (!node) continue;

    nodeMap.set(id, {
      ...node,
      position: {
        ...node.position,
        y: node.position.y + deltaY,
      },
    });
  }
}
/**
 * Dagre may reorder sibling branches vertically depending on its internal layout.
 * In this app, the user's edge creation order is the source of truth:
 * first outgoing edge should appear above the second one.
 *
 * This post-layout pass preserves Dagre spacing/columns while restoring
 * user-defined top-to-bottom branch order.
 */
function enforceSiblingOrderByEdges(nodes, edges) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map();

  for (const edge of edges) {
    if (!outgoing.has(edge.source)) {
      outgoing.set(edge.source, []);
    }

    outgoing.get(edge.source).push(edge.target);
  }

  for (const [, childIds] of outgoing) {
    const existingChildIds = childIds.filter((id) => nodeMap.has(id));

    if (existingChildIds.length < 2) {
      continue;
    }

    const sortedYSlots = existingChildIds
      .map((id) => nodeMap.get(id)?.position?.y ?? 0)
      .sort((a, b) => a - b);

    existingChildIds.forEach((childId, index) => {
      const childNode = nodeMap.get(childId);
      if (!childNode) return;

      const targetY = sortedYSlots[index];
      const currentY = childNode.position.y;
      const deltaY = targetY - currentY;

      if (deltaY !== 0) {
        shiftSubtreeY(nodeMap, childId, edges, deltaY);
      }
    });
  }

  return nodes.map((node) => nodeMap.get(node.id) ?? node);
}

/**
 * Lays out the tree horizontally and aligns terminal nodes to the far-right column.
 */
export function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR", ranksep: 260, nodesep: 60 });

  const depthMap = computeDepthMap(nodes, edges);
  const maxDepth = getTreeMaxDepth(depthMap);

  const nodesForDagre = [...nodes];
  const edgesForDagre = [];

  // Dummy nodes keep shallow terminal branches aligned with the deepest terminal column.
  edges.forEach((edge) => {
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (targetNode?.type === NODE_TYPES.TERMINAL) {
      const sourceNodeId = edge.source;
      const targetNodeId = edge.target;
      const sourceNodeDepth = depthMap.get(sourceNodeId) ?? 0;
      const terminalNodeDepth = sourceNodeDepth + 1;
      const depthDiff = maxDepth - terminalNodeDepth;

      if (depthDiff > 0) {
        let lastNodeIdInChain = sourceNodeId;
        for (let i = 0; i < depthDiff; i++) {
          const dummyId = `dummy|${edge.id}|${i}`;
          nodesForDagre.push({ id: dummyId });
          edgesForDagre.push({
            source: lastNodeIdInChain,
            target: dummyId,
            id: `e-dummy|${lastNodeIdInChain}|${dummyId}`,
            type: "smartChoices",
            data: {},
          });
          lastNodeIdInChain = dummyId;
        }
        edgesForDagre.push({
          source: lastNodeIdInChain,
          target: targetNodeId,
          id: `e-dummy|${lastNodeIdInChain}|${targetNodeId}`,
          type: "smartChoices",
          data: {},
        });
      } else {
        edgesForDagre.push(edge);
      }
    } else {
      edgesForDagre.push(edge);
    }
  });

  nodesForDagre.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 44, height: 44 });
  });

  edgesForDagre.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  let maxLeftX = 0;
  let minY = Infinity;
  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    if (!pos) return;
    const leftX = pos.x - 22;
    if (leftX > maxLeftX) maxLeftX = leftX;
    const topY = pos.y - 22;
    if (topY < minY) minY = topY;
  });

  const yOffset = -minY + 160;

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;

    let finalX = nodeWithPosition.x - 22;
    const finalY = nodeWithPosition.y - 22 + yOffset;

    // Keep all terminal outcomes in the same final column.
    if (node.type === NODE_TYPES.TERMINAL) finalX = maxLeftX;

    return {
      ...node,
      position: {
        x: finalX,
        y: finalY,
      },
    };
  });

  return enforceSiblingOrderByEdges(layoutedNodes, edges);
}

/**
 * Returns X coordinates for stage headers, one per depth level.
 */
export function getUniqueColumnXs(nodes, edges) {
  if (!nodes || nodes.length === 0) return [];
  const depthMap = computeDepthMap(nodes, edges);
  const nodesByDepth = new Map();

  nodes.forEach((node) => {
    const depth = depthMap.get(node.id) ?? 0;
    if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, []);
    nodesByDepth.get(depth).push(node.position.x);
  });

  const sortedDepths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
  return sortedDepths.map((depth) => {
    const xs = nodesByDepth.get(depth);
    return Math.min(...xs);
  });
}

/**
 * Keeps stage labels aligned with the current number of tree columns.
 */
export function syncColumnLabels(nodes, edges, prevLabels = []) {
  const columnCount = getUniqueColumnXs(nodes, edges).length;
  if (columnCount === 0) return [];

  let result = [...prevLabels];
  while (result.length < columnCount) result.push("");
  if (result.length > columnCount) result = result.slice(0, columnCount);
  return result;
}

/**
 * Positions stage headers above the highest visible node.
 */
const STAGE_HEADER_INPUT_HEIGHT = 38;
const STAGE_HEADER_BASE_GAP = 68;

export function computeStageHeaderRowY(nodes) {
  if (!nodes.length) return -STAGE_HEADER_INPUT_HEIGHT - STAGE_HEADER_BASE_GAP;
  let minTop = Infinity;
  for (const n of nodes) minTop = Math.min(minTop, n.position.y);

  return minTop - STAGE_HEADER_INPUT_HEIGHT - STAGE_HEADER_BASE_GAP;
}
