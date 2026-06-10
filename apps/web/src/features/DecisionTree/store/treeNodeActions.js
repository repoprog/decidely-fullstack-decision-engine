import { evaluateAndSetWinningPath } from "../logic/treeAlgorithms.js";

export const createTreeNodeActions = (set) => ({
  updateNodeData: (nodeId, patch) =>
    set((state) => {
      const nextState = {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...patch,
                },
              }
            : node,
        ),
        isDirty: true,
        dataVersion: state.dataVersion + 1,
      };

      return evaluateAndSetWinningPath(nextState);
    }),
});