import { decisionApi } from "../../../api/decisionApi.js";
import { getProjectLoadErrorMessage } from "../../../api/apiError.js";
import { saveLatestVersion } from "../../shared/persistence/saveLatestVersion.js";
import { buildTableSavePayload } from "../logic/tablePayloadBuilder.js";
import { parseSafely } from "./tableInitialState.js";

export const createTablePersistenceActions = (set, get) => ({
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
      buildPayload: buildTableSavePayload,
      saveRequest: decisionApi.saveTable,
      errorMessage: "Nie udało się zapisać tabeli.",
    });
  },

  loadCloudProject: async (projectId) => {
    set({
      isLoading: true,
      loadError: null,
    });

    try {
      const project = await decisionApi.getProject(projectId);
      const parsedContent = parseSafely(project.content);
      const safeContent = parsedContent || {};

      get().loadScenario(safeContent);

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