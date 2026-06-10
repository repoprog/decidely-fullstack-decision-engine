import { decisionApi } from "../../../api/decisionApi.js";
import { getProjectLoadErrorMessage } from "../../../api/apiError.js";
import { EVALUATION_MODES } from "../../../constants/decisionTypes.js";
import { saveLatestVersion } from "../../shared/persistence/saveLatestVersion.js";
import { buildTreeSavePayload } from "../logic/treePayloadBuilder.js";
import { parseProjectContent } from "./treeStateFactory.js";

export const createTreePersistenceActions = (set, get) => ({
  enterPreviewMode: (snapshotId) =>
    set({
      isPreviewMode: true,
      previewingSnapshotId: snapshotId,
      isDirty: false,
    }),

  exitPreviewMode: () =>
    set({
      isPreviewMode: false,
      previewingSnapshotId: null,
    }),

  setCurrentProject: (id, version = null) =>
    set({
      currentProjectId: id,
      currentProjectVersion: version,
    }),

  saveToBackend: async () => {
    const state = get();

    return saveLatestVersion({
      get,
      set,
      projectId: state.currentProjectId,
      buildPayload: buildTreeSavePayload,
      saveRequest: decisionApi.saveTree,
      errorMessage: "Nie udało się zapisać drzewa.",
    });
  },

  loadCloudProject: async (projectId) => {
    set({
      isLoading: true,
      loadError: null,
    });

    try {
      const project = await decisionApi.getProject(projectId);
      const content = parseProjectContent(project.content);

      const nodes = content.nodes || [];
      const edges = content.edges || [];
      const labels = content.stageColumnLabels || content.labels || [];
      const evaluationMode = content.evaluationMode || EVALUATION_MODES.MAX;

      get().loadScenario(nodes, edges, labels, { evaluationMode });

      set({
        currentProjectId: projectId,
        currentProjectVersion: project.version ?? null,
        isDirty: false,
        saveError: null,
        saveConflict: false,
      });
    } catch (error) {
      set({
        loadError: getProjectLoadErrorMessage(error),
      });
    } finally {
      set({ isLoading: false });
    }
  },
});
