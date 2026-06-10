import { NODE_TYPES, EVALUATION_MODES } from "../../../constants/decisionTypes";

/**
 * Local optimistic evaluator for instant tree feedback.
 * The backend remains the authoritative source for persisted analysis results.
 */

/**
 * Safely parses currency-like and locale-specific numeric input into a float.
 *
 * @param {string|number} value Raw UI input, for example "1.234,50 zł" or "1,234.50".
 * @returns {number} Parsed numeric value.
 */

export const parseValue = (value) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  let cleanStr = value.replace(/\s+/g, "").replace(/−|\u2212/g, "-");
  cleanStr = cleanStr.replace(/[^\d.,-]/g, "");

  const lastCommaIndex = cleanStr.lastIndexOf(",");
  const lastDotIndex = cleanStr.lastIndexOf(".");

  if (lastCommaIndex > -1 && lastDotIndex > -1) {
    if (lastCommaIndex > lastDotIndex) {
      // European format: 1.234,50
      cleanStr = cleanStr.replace(/\./g, "");
      cleanStr = cleanStr.replace(",", ".");
    } else {
      // US/UK format: 1,234.50
      cleanStr = cleanStr.replace(/,/g, "");
    }
  } else if (lastCommaIndex > -1) {
    cleanStr = cleanStr.replace(/,/g, ".");
  }

  const parts = cleanStr.split(".");
  if (parts.length > 2) {
    cleanStr = parts[0] + "." + parts.slice(1).join("");
  }

  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
};

export const parseProbabilityString = (p) => {
  if (p == null) return 0;
  return parseFloat(String(p).replace("%", "").replace(",", ".")) || 0;
};

/**
 * Normalizes probabilities to decimal values.
 * Missing sibling probabilities are distributed evenly across unassigned branches.
 */
export const parseProbability = (prob, allSiblings = []) => {
  if (prob != null && prob !== "") {
    return parseValue(prob) / 100;
  }

  const unassignedSiblings = allSiblings.filter(
    (e) => e.data?.probability == null || e.data?.probability === "",
  );

  return 1 / (unassignedSiblings.length || 1);
};

export const formatProbability = (p) => `${parseFloat(p).toFixed(2)}%`;

const formatEqNum = (num) =>
  Number.isInteger(num) ? num : parseFloat(num.toFixed(2));

/**
 * Evaluates local EMV values for all nodes.
 *
 * @param {Array} nodes Graph nodes.
 * @param {Array} edges Graph edges.
 * @param {string} optimizationMode MIN or MAX evaluation logic.
 * @returns {Object} Evaluation result map keyed by node id.
 */
export function evaluateDecisionTree(
  nodes,
  edges,
  optimizationMode = EVALUATION_MODES.MAX,
) {
  if (!nodes || nodes.length === 0) return {};

  const outgoingEdges = new Map();
  for (const edge of edges) {
    if (!outgoingEdges.has(edge.source)) {
      outgoingEdges.set(edge.source, []);
    }
    outgoingEdges.get(edge.source).push(edge);
  }

  const nodesMap = new Map(nodes.map((node) => [node.id, node]));
  const memo = new Map();
  const calculateEvForNode = (nodeId) => {
    if (memo.has(nodeId)) return memo.get(nodeId);

    const node = nodesMap.get(nodeId);
    if (!node) return { ev: 0, steps: 0, equation: "" };

    const childrenEdges = outgoingEdges.get(nodeId) || [];
    let result;

    if (node.type === NODE_TYPES.TERMINAL || childrenEdges.length === 0) {
      const payoff = parseValue(node.data?.payoff);
      result = { ev: payoff, steps: 0, equation: `${formatEqNum(payoff)}` };
    } else if (node.type === NODE_TYPES.CHANCE) {
      let expectedSteps = 0;
      let equationParts = [];

      const totalEv = childrenEdges.reduce((sum, edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const probability = parseProbability(
          edge.data?.probability,
          childrenEdges,
          edge,
        );
        const childResult = calculateEvForNode(edge.target);

        expectedSteps += (childResult.steps + 1) * probability;
        const branchValue = childResult.ev + edgeCost;

        equationParts.push(
          `(${formatEqNum(probability)} × ${formatEqNum(branchValue)})`,
        );
        return sum + branchValue * probability;
      }, 0);

      result = {
        ev: totalEv,
        steps: expectedSteps,
        equation: equationParts.join(" + "),
      };
    } else if (node.type === NODE_TYPES.DECISION) {
      let equationParts = [];

      const childValues = childrenEdges.map((edge) => {
        const edgeCost = parseValue(edge.data?.cost);
        const childResult = calculateEvForNode(edge.target);
        const branchValue = childResult.ev + edgeCost;

        equationParts.push(formatEqNum(branchValue));
        return {
          ev: branchValue,
          steps: childResult.steps + 1,
          edgeId: edge.id,
        };
      });

      if (childValues.length === 0) {
        result = { ev: 0, steps: 0, equation: "0" };
      } else {
        const bestResult = childValues.reduce(
          (best, current) => {
            if (optimizationMode === EVALUATION_MODES.MAX) {
              if (current.ev > best.ev) return current;
              if (current.ev === best.ev && current.steps < best.steps)
                return current; // Tie-breaker: shortest path
            } else {
              if (current.ev < best.ev) return current;
              if (current.ev === best.ev && current.steps < best.steps)
                return current;
            }
            return best;
          },
          {
            ev:
              optimizationMode === EVALUATION_MODES.MAX ? -Infinity : Infinity,
            steps: Infinity,
            edgeId: null,
          },
        );

        const operator =
          optimizationMode === EVALUATION_MODES.MAX
            ? EVALUATION_MODES.MAX
            : EVALUATION_MODES.MIN;
        result = {
          ev: bestResult.ev,
          steps: bestResult.steps,
          optimalEdgeId: bestResult.edgeId,
          equation: `${operator}(${equationParts.join(", ")})`,
        };
      }
    } else {
      result = { ev: 0, steps: 0, equation: "" };
    }

    memo.set(nodeId, result);
    return result;
  };

  for (const node of nodes) {
    if (!memo.has(node.id)) {
      calculateEvForNode(node.id);
    }
  }

  return Object.fromEntries(memo);
}

/**
 * Distributes remaining probability equally across unlocked outgoing branches.
 * The final branch absorbs rounding differences so sibling probabilities sum to 100%.
 */
export function rebalanceProbabilities(edges, sourceId) {
  const childEdges = edges.filter((e) => e.source === sourceId);
  if (childEdges.length === 0) return edges;

  const lockedEdges = childEdges.filter((e) => e.data.isLocked);
  const unlockedEdges = childEdges.filter((e) => !e.data.isLocked);

  const lockedTotal = lockedEdges.reduce(
    (sum, e) => sum + parseProbability(e.data.probability) * 100,
    0,
  );
  const remainder = Math.max(0, 100 - lockedTotal);

  let updatedEdges = [...edges];

  if (unlockedEdges.length > 0) {
    const evenSplit = remainder / unlockedEdges.length;
    let distributedRemainder = 0;

    unlockedEdges.forEach((edge, idx) => {
      let newProb;
      if (idx < unlockedEdges.length - 1) {
        newProb = parseFloat(evenSplit.toFixed(2));
        distributedRemainder += newProb;
      } else {
        // Final branch absorbs any rounding discrepancies to perfectly hit 100%
        newProb = parseFloat((remainder - distributedRemainder).toFixed(2));
      }

      const edgeIndex = updatedEdges.findIndex((e) => e.id === edge.id);
      if (edgeIndex !== -1) {
        updatedEdges[edgeIndex] = {
          ...updatedEdges[edgeIndex],
          data: {
            ...updatedEdges[edgeIndex].data,
            probability: formatProbability(newProb),
          },
        };
      }
    });
  }
  return updatedEdges;
}

/**
 * Calculates cumulative probability of reaching each node from the root.
 */
export function calculatePathProbabilities(nodes, edges) {
  const probMap = {};
  const rootNodes = nodes.filter((n) => !edges.some((e) => e.target === n.id));
  const queue = rootNodes.map((r) => ({ id: r.id, currentProb: 1.0 }));

  while (queue.length > 0) {
    const { id, currentProb } = queue.shift();
    probMap[id] = currentProb;

    const node = nodes.find((n) => n.id === id);
    const outgoingEdges = edges.filter((e) => e.source === id);

    outgoingEdges.forEach((edge) => {
      let nextProb = currentProb;
      if (node?.type === NODE_TYPES.CHANCE) {
        const edgeP = parseProbability(edge.data?.probability);
        nextProb = currentProb * edgeP;
      }
      queue.push({ id: edge.target, currentProb: nextProb });
    });
  }
  return probMap;
}

/**
 * Runs local validation, EMV evaluation and winning-path tracing.
 */
export const evaluateAndSetWinningPath = (state) => {
  const { nodes, edges, evaluationMode } = state;

  let hasProbabilityError = false;

 
  for (const node of nodes) {
    if (node.type === NODE_TYPES.CHANCE) {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length > 0) {
        const sum = outgoingEdges.reduce(
          (acc, e) => acc + parseProbability(e.data?.probability) * 100,
          0,
        );
        if (Math.abs(sum - 100) > 0.01) {
          hasProbabilityError = true;
          break;
        }
      }
    }
  }

 
  if (hasProbabilityError) {
    const nodesWithoutEv = nodes.map((node) => {
      const newData = { ...node.data };
      delete newData.expectedValue;
      delete newData.equation;
      return { ...node, data: newData };
    });
   // Invalidate stale backend responses even when local validation fails.
    return {
      ...state,
      nodes: nodesWithoutEv,
      evaluationMap: {},
      winningPath: [],
      dataVersion: Date.now(),
    };
  }

  
  const evaluationMap = evaluateDecisionTree(nodes, edges, evaluationMode);
  const cumulativeProbs = calculatePathProbabilities(nodes, edges);

  // Hydrate nodes with evaluated data
  const nodesWithEv = nodes.map((node) => {
    const evaluationResult = evaluationMap[node.id];
    const newData = { ...node.data };

    delete newData.expectedValue;

    if (
      evaluationResult &&
      typeof evaluationResult.ev === "number" &&
      !isNaN(evaluationResult.ev)
    ) {
      newData.expectedValue = evaluationResult.ev;
      newData.equation = evaluationResult.equation;
    }

    newData.pathProbability = cumulativeProbs[node.id] ?? 0;
    return { ...node, data: newData };
  });

  const winningPathSet = new Set();

  const rootNode = nodesWithEv.find(
    (n) =>
      (n.type === NODE_TYPES.DECISION || n.type === NODE_TYPES.CHANCE) &&
      !edges.some((e) => e.target === n.id),
  );
  if (rootNode) {
    const queue = [rootNode.id];
    winningPathSet.add(rootNode.id);

    while (queue.length > 0) {
      const currentNodeId = queue.shift();
      const currentNode = nodesWithEv.find((n) => n.id === currentNodeId);
      const evaluationResult = evaluationMap[currentNodeId];

      if (
        currentNode?.type === NODE_TYPES.DECISION &&
        evaluationResult?.optimalEdgeId
      ) {
        const optimalEdge = edges.find(
          (e) => e.id === evaluationResult.optimalEdgeId,
        );
        if (optimalEdge) {
          winningPathSet.add(optimalEdge.id);
          winningPathSet.add(optimalEdge.target);
          queue.push(optimalEdge.target);
        }
      } else {
        const childEdges = edges.filter((e) => e.source === currentNodeId);
        childEdges.forEach((edge) => {
          if (currentNode?.type === NODE_TYPES.CHANCE) {
            winningPathSet.add(edge.id);
            winningPathSet.add(edge.target);
            queue.push(edge.target);
          }
        });
      }
    }
  }

  return {
    ...state,
    nodes: nodesWithEv,
    evaluationMap,
    winningPath: Array.from(winningPathSet),
  };
};
