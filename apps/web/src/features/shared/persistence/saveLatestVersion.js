import { getApiErrorMessage, getApiStatus } from "../../../api/apiError.js";
import { useToastStore } from "../../../store/useToastStore.js";

export const SAVE_STATUS = {
  SUCCESS: "success",
  SKIPPED: "skipped",
  IN_FLIGHT: "in_flight",
  CONFLICT: "conflict",
  FAILED: "failed",
};

export const SaveResult = {
  success: (savedProject) => ({
    status: SAVE_STATUS.SUCCESS,
    savedProject,
  }),

  skipped: (reason) => ({
    status: SAVE_STATUS.SKIPPED,
    reason,
  }),

  inFlight: () => ({
    status: SAVE_STATUS.IN_FLIGHT,
  }),

  conflict: (message) => ({
    status: SAVE_STATUS.CONFLICT,
    message,
  }),

  failed: (message) => ({
    status: SAVE_STATUS.FAILED,
    message,
  }),
};

export async function saveLatestVersion({
  get,
  set,
  projectId,
  buildPayload,
  saveRequest,
  errorMessage = "Nie udało się zapisać zmian.",
}) {
  const initialState = get();

  if (!projectId) {
    return SaveResult.skipped("NO_PROJECT_ID");
  }

  if (initialState.isPreviewMode) {
    return SaveResult.skipped("PREVIEW_MODE");
  }

  if (initialState.isSaving) {
    return SaveResult.inFlight();
  }

  const localRevisionAtStart = initialState.dataVersion;
  const payload = buildPayload(initialState);

  set({
    isSaving: true,
    saveError: null,
    saveConflict: false,
  });

  try {
    const savedProject = await saveRequest(projectId, payload);

    const latestState = get();
    const hasNewerLocalChanges =
      latestState.dataVersion !== localRevisionAtStart;

    set({
      isSaving: false,
      isDirty: hasNewerLocalChanges,
      currentProjectVersion:
        savedProject?.version ?? latestState.currentProjectVersion,
      saveError: null,
      saveConflict: false,
    });

    if (
      hasNewerLocalChanges &&
      latestState.currentProjectId === projectId &&
      !latestState.isPreviewMode
    ) {
      queueMicrotask(() => {
        get().saveToBackend();
      });
    }

    return SaveResult.success(savedProject);
  } catch (error) {
    const status = getApiStatus(error);
    const isConflict = status === 409;
    const message = getApiErrorMessage(error, errorMessage);

    set({
      isSaving: false,
      isDirty: true,
      saveError: message,
      saveConflict: isConflict,
    });

    useToastStore
      .getState()
      .addToast(isConflict ? "Konflikt wersji projektu." : message, "error");

    return isConflict
      ? SaveResult.conflict(message)
      : SaveResult.failed(message);
  }
}