import { getApiErrorMessage } from "../../../api/apiError.js";
import { EVALUATION_MODES } from "../../../constants/decisionTypes.js";
import { useToastStore } from "../../../store/useToastStore.js";
import { localTemplateRepository } from "../../shared/templates/localTemplateRepository";
import { evaluateAndSetWinningPath } from "../logic/treeAlgorithms.js";
import {
  createBlankTreeState,
  createLayoutedTreeState,
} from "./treeStateFactory.js";

export const createTreeScenarioActions = (set, get) => ({
  loadTemplateScenario: async (templateId) => {
    set({ isLoading: true });

    try {
      const data = await localTemplateRepository.getTreeTemplate(templateId);

      get().loadScenario(
        data.nodes || [],
        data.edges || [],
        data.labels || [],
        {
          clearProjectId: true,
          evaluationMode: data.evaluationMode || EVALUATION_MODES.MAX,
        },
      );
    } catch (error) {
      useToastStore
        .getState()
        .addToast(
          getApiErrorMessage(error, "Nie udało się załadować szablonu."),
          "error",
        );
    } finally {
      set({ isLoading: false });
    }
  },

  loadScenario: (
    newNodes,
    newEdges,
    newLabels = [],
    { clearProjectId = false, evaluationMode = null } = {},
  ) =>
    set((state) => ({
      ...createLayoutedTreeState(state, newNodes, newEdges, newLabels, {
        evaluationMode: evaluationMode || state.evaluationMode,
        isDirty: false,
        clearProjectId,
      }),
      backendWarnings: [],
      loadError: null,
      isCalculating: false,
      saveError: null,
      saveConflict: false,
    })),

  resetTree: () =>
    set((state) => ({
      ...createBlankTreeState(state),
      currentProjectVersion: null,
      saveError: null,
      saveConflict: false,
      loadError: null,
      isSimulationMode: false,
      isPreviewMode: false,
      previewingSnapshotId: null,
      backendWarnings: [],
      isCalculating: false,
      isSaving: false,
    })),

  importData: (data) => {
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      return false;
    }

    set((state) =>
      createLayoutedTreeState(
        state,
        data.nodes,
        data.edges,
        data.stageColumnLabels || data.labels || [],
        {
          evaluationMode: data.evaluationMode || EVALUATION_MODES.MAX,
          isDirty: false,
          clearProjectId: true,
        },
      ),
    );

    return true;
  },

  init: () => set((state) => evaluateAndSetWinningPath(state)),
});