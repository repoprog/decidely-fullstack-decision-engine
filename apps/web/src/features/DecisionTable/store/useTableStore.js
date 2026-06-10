import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getInitialTableState } from "./tableInitialState.js";
import { createTableScenarioActions } from "./tableScenarioActions.js";
import { createTablePersistenceActions  } from "./tablePersistenceActions.js";
import { createTableAnalysisActions } from "./tableAnalysisActions.js";
import { createTableDomainActions } from "./tableDomainActions.js";
import { createTableViewActions } from "./tableViewActions.js";
import { createTableScaleActions } from "./tableScaleActions.js";

export const useTableStore = create()(
  persist(
    (set, get) => {
      const withDirty = (state, updates) => ({
        ...updates,
        isDirty: true,
        dataVersion: state.dataVersion + 1,
        backendAnalysisResult: null,
        backendWarnings: [],
        saveError: null,
      });

      return {
        ...getInitialTableState(),
        ...createTablePersistenceActions (set, get),
        ...createTableScenarioActions(set, get),
        ...createTableAnalysisActions(set, get),
        ...createTableDomainActions(set, withDirty),
        ...createTableScaleActions(set, withDirty),
        ...createTableViewActions(set, withDirty),
      };
    },
    {
      name: "table-storage",
      partialize: (state) => ({
        alternatives: state.alternatives,
        objectives: state.objectives,
        cells: state.cells,
        objectiveUnits: state.objectiveUnits,
        sortDirections: state.sortDirections,
        customScales: state.customScales,
        activePreset: state.activePreset,
        hideEqualizedObjectives: state.hideEqualizedObjectives,
        rejectedAlternatives: state.rejectedAlternatives,
      }),
    },
  ),
);
