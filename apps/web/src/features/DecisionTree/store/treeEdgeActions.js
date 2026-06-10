import {
  evaluateAndSetWinningPath,
  formatProbability,
  rebalanceProbabilities,
} from "../logic/treeAlgorithms.js";

export const createTreeEdgeActions = (set) => ({
  updateEdgeData: (edgeId, patch) =>
    set((state) => {
      const nextState = {
        ...state,
        edges: state.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  ...patch,
                },
              }
            : edge,
        ),
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };

      return evaluateAndSetWinningPath(nextState);
    }),

  toggleEdgesCost: (sourceNodeId) =>
    set((state) => {
      const firstEdge = state.edges.find(
        (edge) => edge.source === sourceNodeId,
      );
      const willShow = firstEdge ? !firstEdge.data?.showCost : true;

      const nextState = {
        ...state,
        edges: state.edges.map((edge) =>
          edge.source === sourceNodeId
            ? {
                ...edge,
                data: {
                  ...edge.data,
                  showCost: willShow,
                  localShowCost: false,
                },
              }
            : edge,
        ),
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };

      return evaluateAndSetWinningPath(nextState);
    }),

  setEdgeProbability: (edgeId, newProbabilityValue) =>
    set((state) => {
      let allEdges = [...state.edges];
      const editedEdgeIndex = allEdges.findIndex(
        (edge) => edge.id === edgeId,
      );

      if (editedEdgeIndex === -1) {
        return state;
      }

      const editedEdge = allEdges[editedEdgeIndex];
      const newProbability = Math.max(0, newProbabilityValue);

      allEdges[editedEdgeIndex] = {
        ...editedEdge,
        data: {
          ...editedEdge.data,
          probability: formatProbability(newProbability),
          isLocked: true,
        },
      };

      const updatedEdges = rebalanceProbabilities(
        allEdges,
        editedEdge.source,
      );

      const nextState = {
        ...state,
        edges: updatedEdges,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };

      return evaluateAndSetWinningPath(nextState);
    }),

  toggleEdgeAutoBalance: (edgeId) =>
    set((state) => {
      let allEdges = [...state.edges];
      const edgeIndex = allEdges.findIndex((edge) => edge.id === edgeId);

      if (edgeIndex === -1) {
        return state;
      }

      const edge = allEdges[edgeIndex];
      const isCurrentlyLocked = edge.data?.isLocked;

      allEdges[edgeIndex] = {
        ...edge,
        data: {
          ...edge.data,
          isLocked: !isCurrentlyLocked,
        },
      };

      if (isCurrentlyLocked) {
        allEdges = rebalanceProbabilities(allEdges, edge.source);
      }

      const nextState = {
        ...state,
        edges: allEdges,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };

      return evaluateAndSetWinningPath(nextState);
    }),
});