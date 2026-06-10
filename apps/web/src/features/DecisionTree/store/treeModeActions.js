import { NODE_TYPES } from "../../../constants/decisionTypes.js";
import {
  evaluateAndSetWinningPath,
} from "../logic/treeAlgorithms.js";

export const createTreeModeActions = (set) => ({
  setEvaluationMode: (mode) =>
    set((state) =>
      evaluateAndSetWinningPath({
        ...state,
        evaluationMode: mode,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      }),
    ),

  setStageColumnLabel: (index, text) =>
    set((state) => {
      if (index < 0) {
        return state;
      }

      const next = [...state.stageColumnLabels];

      while (next.length <= index) {
        next.push("");
      }

      next[index] = text;

      return {
        stageColumnLabels: next,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };
    }),

  toggleSimulationMode: () =>
    set((state) => {
      const nextSimulationMode = !state.isSimulationMode;

      if (!nextSimulationMode) {
        return { isSimulationMode: false };
      }

      const chanceNodeIds = new Set(
        state.nodes
          .filter((node) => node.type === NODE_TYPES.CHANCE)
          .map((node) => node.id),
      );

      let hasChanges = false;

      const nextEdges = state.edges.map((edge) => {
        if (
          chanceNodeIds.has(edge.source) &&
          edge.data?.isLocked !== false
        ) {
          hasChanges = true;

          return {
            ...edge,
            data: {
              ...edge.data,
              isLocked: false,
            },
          };
        }

        return edge;
      });

      if (!hasChanges) {
        return { isSimulationMode: true };
      }

      const nextState = {
        ...state,
        edges: nextEdges,
        isSimulationMode: true,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };

      return evaluateAndSetWinningPath(nextState);
    }),
});