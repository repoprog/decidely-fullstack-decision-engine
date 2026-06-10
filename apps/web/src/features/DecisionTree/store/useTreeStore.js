import { create, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import { getInitialTreeState } from "./treeStateFactory.js";
import { createTreePersistenceActions  } from "./treePersistenceActions.js";
import { createTreeScenarioActions } from "./treeScenarioActions.js";
import { createTreeAnalysisActions } from "./treeAnalysisActions.js";
import { createTreeModeActions } from "./treeModeActions.js";
import { createTreeEdgeActions } from "./treeEdgeActions.js";
import { createTreeNodeActions } from "./treeNodeActions.js";
import { createTreeGraphActions } from "./treeGraphActions.js";

export const useTreeStore = create()(
  persist(
    temporal(
      (set, get) => ({
        ...getInitialTreeState(),
        ...createTreePersistenceActions (set, get),
        ...createTreeScenarioActions(set, get),
        ...createTreeAnalysisActions(set, get),
        ...createTreeModeActions(set),
        ...createTreeEdgeActions(set),
        ...createTreeNodeActions(set),
        ...createTreeGraphActions(set),
      }),
      {
        limit: 50,

        // Track only graph-relevant state in undo/redo history.
        partialize: (state) => ({
          nodes: state.nodes,
          edges: state.edges,
          stageColumnLabels: state.stageColumnLabels,
          evaluationMode: state.evaluationMode,
          evaluationMap: state.evaluationMap,
          winningPath: state.winningPath,
        }),

        // Avoid recording undo/redo entries for transient UI state changes.
        equality: (pastState, currentState) =>
          pastState.nodes === currentState.nodes &&
          pastState.edges === currentState.edges &&
          pastState.stageColumnLabels === currentState.stageColumnLabels &&
          pastState.evaluationMode === currentState.evaluationMode,
      },
    ),
    {
      name: "tree-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        stageColumnLabels: state.stageColumnLabels,
        evaluationMode: state.evaluationMode,
      }),
    },
  ),
);

export const useTemporalTreeStore = (selector) =>
  useStore(useTreeStore.temporal, selector);

useTreeStore.getState().init();
useTreeStore.temporal.getState().clear();
