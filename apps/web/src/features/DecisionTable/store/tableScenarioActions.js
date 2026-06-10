import { getApiErrorMessage } from "../../../api/apiError.js";
import { useToastStore } from "../../../store/useToastStore.js";
import { localTemplateRepository } from "../../shared/templates/localTemplateRepository";
import { getInitialTableState } from "./tableInitialState.js";

export const createTableScenarioActions = (set, get) => ({
  loadTemplateScenario: async (templateId) => {
    set({ isLoading: true });

    try {
      const data = await localTemplateRepository.getTableTemplate(templateId);

      get().loadScenario(data, { clearProjectId: true });
    } catch (error) {
      useToastStore
        .getState()
        .addToast(
          getApiErrorMessage(error, "Nie udało się wczytać szablonu."),
          "error",
        );
    } finally {
      set({ isLoading: false });
    }
  },

  loadScenario: (scenario, { clearProjectId = false } = {}) =>
    set((state) => {
      const rejectedAlternatives = Array.isArray(
        scenario.rejectedAlternatives,
      )
        ? scenario.rejectedAlternatives
        : [];

      return {
        alternatives: scenario.alternatives || [],
        objectives: scenario.objectives || [],
        cells: scenario.cells || {},
        originalCells: scenario.originalCells || {},
        objectiveUnits: scenario.objectiveUnits || {},
        sortDirections: scenario.sortDirections || {},

        customScales: Array.isArray(scenario.customScales)
          ? scenario.customScales
          : state.customScales,

        activePreset:
          scenario.activePreset !== undefined
            ? scenario.activePreset
            : state.activePreset,

        rejectedAlternatives,
        showRejected: rejectedAlternatives.length > 0,

        showTradeoffs: false,
        showRanking: false,
        hideEqualizedObjectives: false,
        isDirty: false,
        saveError: null,
        saveConflict: false,
        backendAnalysisResult: null,
        backendWarnings: [],
        dataVersion: state.dataVersion + 1,

        ...(clearProjectId && {
          currentProjectId: null,
          currentProjectVersion: null,
          isPreviewMode: false,
          previewingSnapshotId: null,
        }),
      };
    }),

  importData: (data) => {
    const isValidTableData =
      data &&
      Array.isArray(data.alternatives) &&
      Array.isArray(data.objectives) &&
      data.cells &&
      typeof data.cells === "object";

    if (!isValidTableData) {
      return false;
    }

    get().loadScenario(data, { clearProjectId: true });
    return true;
  },

  resetAll: () =>
    set((state) => ({
      ...getInitialTableState(),
      dataVersion: state.dataVersion + 1,
    })),
});