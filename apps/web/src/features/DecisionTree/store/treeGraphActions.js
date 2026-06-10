import { NODE_TYPES } from "../../../constants/decisionTypes.js";
import { collectDescendants, nextDomId } from "../logic/treeUtils.js";
import { rebalanceProbabilities } from "../logic/treeAlgorithms.js";
import { createLayoutedTreeState } from "./treeStateFactory.js";

export const createTreeGraphActions = (set) => ({
  addBranch: (parentId, childKind) =>
    set((state) => {
      const parent = state.nodes.find((node) => node.id === parentId);

      if (
        !parent ||
        (parent.type !== NODE_TYPES.DECISION &&
          parent.type !== NODE_TYPES.CHANCE)
      ) {
        return state;
      }

      const newNodeId = nextDomId(
        childKind === NODE_TYPES.CHANCE ? "c" : "t",
      );

      const existingOutgoing = state.edges.filter(
        (edge) => edge.source === parentId,
      );

      const isFromChance = parent.type === NODE_TYPES.CHANCE;

      const edgeData = isFromChance
        ? {
            optionLabel: `Zdarzenie ${existingOutgoing.length + 1}`,
            probability: "0%",
            isLocked: false,
          }
        : {
            optionLabel: `Opcja ${existingOutgoing.length + 1}`,
            probability: null,
          };

      const newNode = {
        id: newNodeId,
        type: childKind,
        position: { x: 0, y: 0 },
        zIndex: 100,
        data:
          childKind === NODE_TYPES.TERMINAL
            ? { payoff: "0 zł" }
            : { nodeNumber: 0 },
      };

      const newEdge = {
        id: nextDomId("e"),
        source: parentId,
        target: newNodeId,
        type: "smartChoices",
        data: edgeData,
      };

      let nextEdges = [...state.edges, newEdge];

      if (isFromChance) {
        nextEdges = rebalanceProbabilities(nextEdges, parentId);
      }

      const nextNodes = [...state.nodes, newNode];

      return createLayoutedTreeState(
        state,
        nextNodes,
        nextEdges,
        state.stageColumnLabels,
        { isDirty: true },
      );
    }),

  removeNode: (nodeId) =>
    set((state) => {
      const incomingEdge = state.edges.find((edge) => edge.target === nodeId);

      if (!incomingEdge) {
        return state;
      }

      const removeSet = collectDescendants(nodeId, state.edges);
      const parentId = incomingEdge.source;

      let nextEdges = state.edges.filter(
        (edge) =>
          !removeSet.has(edge.source) && !removeSet.has(edge.target),
      );

      const parent = state.nodes.find((node) => node.id === parentId);

      if (parent?.type === NODE_TYPES.CHANCE) {
        nextEdges = rebalanceProbabilities(nextEdges, parentId);
      }

      const nextNodes = state.nodes.filter(
        (node) => !removeSet.has(node.id),
      );

      return createLayoutedTreeState(
        state,
        nextNodes,
        nextEdges,
        state.stageColumnLabels,
        { isDirty: true },
      );
    }),

  swapNodeType: (nodeId, newType) =>
    set((state) => {
      const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);

      if (nodeIndex === -1) {
        return state;
      }

      const node = state.nodes[nodeIndex];

      if (node.type === newType) {
        return state;
      }

      let nextNodes = [...state.nodes];
      let nextEdges = [...state.edges];

      if (newType === NODE_TYPES.TERMINAL) {
        const removeSet = collectDescendants(nodeId, state.edges);
        removeSet.delete(nodeId);

        nextNodes = nextNodes.filter((item) => !removeSet.has(item.id));

        nextEdges = nextEdges.filter(
          (edge) =>
            !removeSet.has(edge.source) &&
            !removeSet.has(edge.target) &&
            edge.source !== nodeId,
        );
      }

      const targetIndex = nextNodes.findIndex((item) => item.id === nodeId);

      if (targetIndex === -1) {
        return state;
      }

      const oldData = nextNodes[targetIndex].data;
      let newData = { ...oldData };

      if (newType === NODE_TYPES.TERMINAL) {
        newData = {
          payoff: oldData.payoff || "0 zł",
        };

        delete newData.nodeNumber;
      } else {
        newData = {
          nodeNumber: oldData.nodeNumber || 0,
        };

        delete newData.payoff;
      }

      nextNodes[targetIndex] = {
        ...nextNodes[targetIndex],
        type: newType,
        data: newData,
      };

      if (newType !== NODE_TYPES.TERMINAL) {
        nextEdges = nextEdges.map((edge) => {
          if (edge.source !== nodeId) {
            return edge;
          }

          if (newType === NODE_TYPES.DECISION) {
            return {
              ...edge,
              data: {
                ...edge.data,
                probability: null,
                isLocked: false,
              },
            };
          }

          if (newType === NODE_TYPES.CHANCE) {
            return {
              ...edge,
              data: {
                ...edge.data,
                probability: "0%",
                isLocked: false,
              },
            };
          }

          return edge;
        });

        if (newType === NODE_TYPES.CHANCE) {
          nextEdges = rebalanceProbabilities(nextEdges, nodeId);
        }
      }

      return createLayoutedTreeState(
        state,
        nextNodes,
        nextEdges,
        state.stageColumnLabels,
        { isDirty: true },
      );
    }),

  removeBranch: (parentId) =>
    set((state) => {
      const parent = state.nodes.find((node) => node.id === parentId);

      if (!parent) {
        return state;
      }

      const outgoing = state.edges.filter((edge) => edge.source === parentId);

      if (!outgoing.length) {
        return state;
      }

      const nodeById = new Map(state.nodes.map((node) => [node.id, node]));

      const sortedOutgoing = [...outgoing].sort((a, b) => {
        const yA = nodeById.get(a.target)?.position?.y ?? 0;
        const yB = nodeById.get(b.target)?.position?.y ?? 0;

        return yB - yA;
      });

      const victimEdge = sortedOutgoing[0];

      const removeSet = collectDescendants(victimEdge.target, state.edges);

      let nextEdges = state.edges.filter(
        (edge) =>
          edge.id !== victimEdge.id &&
          !removeSet.has(edge.source) &&
          !removeSet.has(edge.target),
      );

      if (parent.type === NODE_TYPES.CHANCE) {
        nextEdges = rebalanceProbabilities(nextEdges, parentId);
      }

      const nextNodes = state.nodes.filter(
        (node) => !removeSet.has(node.id),
      );

      return createLayoutedTreeState(
        state,
        nextNodes,
        nextEdges,
        state.stageColumnLabels,
        { isDirty: true },
      );
    }),
});