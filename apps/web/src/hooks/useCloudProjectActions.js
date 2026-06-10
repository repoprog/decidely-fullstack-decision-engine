import { useEffect, useState } from "react";
import { decisionApi } from "../api/decisionApi";
import { getApiErrorMessage, getApiStatus } from "../api/apiError";
import useAuthStore from "../store/useAuthStore";
import { useToastStore } from "../store/useToastStore";

const SAVE_CONFLICT_MESSAGE =
  "Najpierw odśwież projekt z chmury, aby rozwiązać konflikt wersji.";

const parseProjectContent = (rawContent) => {
  if (typeof rawContent !== "string") {
    return rawContent || {};
  }

  try {
    return JSON.parse(rawContent);
  } catch {
    return {};
  }
};

const mapSnapshotToHistoryItem = (snapshot) => ({
  id: snapshot.id,
  title: snapshot.label,
  date: snapshot.createdAt,
  tags: snapshot.smartTags || [],
});

export function useCloudProjectActions({
  projectType,
  currentProjectId,
  currentProjectVersion,
  setCurrentProject,
  saveToBackend,
  loadScenarioFn,
  enterPreviewMode,
  exitPreviewMode,
  getCurrentStateFn,
  setGlobalDirty,
  saveConflict = false,
}) {
  const addToast = useToastStore((state) => state.addToast);
  const { isAuthenticated, openLoginModal } = useAuthStore();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);

  const [historyItems, setHistoryItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewCache, setPreviewCache] = useState(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [previewSnapshotId, setPreviewSnapshotId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !pendingSave) {
      return;
    }

    setPendingSave(false);

    if (saveConflict) {
      addToast(SAVE_CONFLICT_MESSAGE, "warning");
      return;
    }

    if (currentProjectId) {
      setIsSnapshotModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  }, [isAuthenticated, pendingSave, currentProjectId, saveConflict, addToast]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentProjectId) {
        setHistoryItems([]);
        return;
      }

      try {
        const data = await decisionApi.getSnapshots(currentProjectId);
        setHistoryItems(data.map(mapSnapshotToHistoryItem));
      } catch (error) {
        addToast(
          getApiErrorMessage(
            error,
            "Nie udało się załadować historii projektu.",
          ),
          "warning",
        );
      }
    };

    fetchHistory();
  }, [currentProjectId, addToast]);

 const ensureProjectSaved = async (fallbackMessage) => {
  const saveResult = await saveToBackend();

  if (saveResult?.status === "success") {
    return true;
  }

  if (saveResult?.status === "in_flight") {
    return false;
  }

  if (saveResult?.status === "skipped") {
    if (saveResult.reason === "PREVIEW_MODE") {
      addToast("Nie można zapisać projektu w trybie podglądu wersji.", "warning");
    } else if (saveResult.reason === "NO_PROJECT_ID") {
      addToast("Najpierw zapisz projekt w chmurze.", "warning");
    }

    return false;
  }

  // Conflict UI is handled by saveLatestVersion and SaveConflictBanner.
  if (saveResult?.status === "conflict") {
    return false;
  }

  addToast(saveResult?.message || fallbackMessage, "error");

  return false;
};

  const handleSaveClick = () => {
    if (!isAuthenticated) {
      addToast(
        "Twoja praca jest bezpieczna. Zaloguj się, aby przenieść ją do chmury.",
        "info",
      );

      setPendingSave(true);
      openLoginModal();
      return;
    }

    if (saveConflict) {
      addToast(SAVE_CONFLICT_MESSAGE, "warning");
      return;
    }

    setPendingSave(false);

    if (currentProjectId) {
      setIsSnapshotModalOpen(true);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const handleCreateProject = async ({ title, notes }) => {
    const trimmedTitle = title.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedTitle) {
      return;
    }

    setIsSaving(true);

    try {
      const project = await decisionApi.createProject(
        trimmedTitle,
        projectType,
        {
          notes: trimmedNotes,
        },
      );

      setCurrentProject(project.id, project.version ?? null);

      const isProjectSaved = await ensureProjectSaved(
        "Decyzja została utworzona, ale nie udało się zapisać jej zawartości.",
      );

      if (!isProjectSaved) {
        return;
      }

      addToast("Decyzja została utworzona.", "success");
      setIsCreateModalOpen(false);
    } catch (error) {
      if (getApiStatus(error) === 401) {
        openLoginModal();
      }

      addToast(
        getApiErrorMessage(error, "Wystąpił błąd podczas tworzenia decyzji."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSnapshot = async (label) => {
    const trimmedLabel = label.trim();

    if (!trimmedLabel || !currentProjectId) {
      return;
    }

    setIsSaving(true);

    try {
      const isProjectSaved = await ensureProjectSaved(
        "Nie udało się zapisać projektu, więc wersja nie została utworzona.",
      );

      if (!isProjectSaved) {
        setIsSnapshotModalOpen(false);
        return;
      }

      const snapshot = await decisionApi.createSnapshot(
        currentProjectId,
        trimmedLabel,
      );

      setHistoryItems((previousItems) => [
        mapSnapshotToHistoryItem(snapshot),
        ...previousItems,
      ]);

      addToast(`Wersja "${trimmedLabel}" zapisana.`, "success");
      setIsSnapshotModalOpen(false);
    } catch (error) {
      if (getApiStatus(error) === 401) {
        openLoginModal();
      }

      addToast(
        getApiErrorMessage(error, "Nie udało się zapisać wersji."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectHistoryItem = async (id) => {
    if (!currentProjectId) {
      addToast("Zapisz projekt w chmurze, aby przeglądać historię.", "warning");
      setIsHistoryOpen(false);
      return;
    }

    if (saveConflict) {
      addToast(SAVE_CONFLICT_MESSAGE, "warning");
      setIsHistoryOpen(false);
      return;
    }

    setIsSaving(true);

    try {
      const isProjectSaved = await ensureProjectSaved(
        "Nie udało się zapisać bieżących zmian przed wczytaniem historii.",
      );

      if (!isProjectSaved) {
        setIsHistoryOpen(false);
        return;
      }

      if (getCurrentStateFn) {
        setPreviewCache(getCurrentStateFn());
      }

      const snapshot = await decisionApi.getSnapshot(currentProjectId, id);
      const content = parseProjectContent(snapshot.content);

      loadScenarioFn(content);
      enterPreviewMode(id);
      setPreviewSnapshotId(id);

      addToast(`Podgląd wersji: ${snapshot.label || "Nieznana"}`, "info");
      setIsHistoryOpen(false);
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się wczytać wersji z serwera."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async () => {
    if (saveConflict) {
      addToast(SAVE_CONFLICT_MESSAGE, "warning");
      return;
    }

    if (!currentProjectId || !previewSnapshotId) {
      addToast("Nie wybrano wersji do przywrócenia.", "warning");
      return;
    }

    if (currentProjectVersion === null || currentProjectVersion === undefined) {
      addToast(
        "Brak aktualnej wersji projektu. Odśwież projekt z chmury i spróbuj ponownie.",
        "warning",
      );
      return;
    }

    setIsSaving(true);

    try {
      const restoredProject = await decisionApi.restoreSnapshot(
        currentProjectId,
        previewSnapshotId,
        currentProjectVersion,
      );

      const content = parseProjectContent(restoredProject.content);

      loadScenarioFn(content);
      setCurrentProject(restoredProject.id, restoredProject.version ?? null);
      exitPreviewMode();
      setPreviewCache(null);
      setPreviewSnapshotId(null);

      if (typeof setGlobalDirty === "function") {
        setGlobalDirty(false);
      }

      addToast("Wersja przywrócona z historii.", "success");
    } catch (error) {
      addToast(
        getApiErrorMessage(error, "Nie udało się przywrócić wersji."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClosePreview = async () => {
    if (previewCache) {
      loadScenarioFn(previewCache);
      exitPreviewMode();
      setPreviewCache(null);
      setPreviewSnapshotId(null);
      return;
    }

    try {
      const originalProject = await decisionApi.getProject(currentProjectId);
      const content = parseProjectContent(originalProject.content);

      loadScenarioFn(content);
    } catch (error) {
      addToast(
        getApiErrorMessage(
          error,
          "Błąd połączenia. Wróciłeś do bieżącej wersji lokalnej.",
        ),
        "warning",
      );
    } finally {
      exitPreviewMode();
      setPreviewCache(null);
      setPreviewSnapshotId(null);
    }
  };

  return {
    isHistoryOpen,
    setIsHistoryOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isSnapshotModalOpen,
    setIsSnapshotModalOpen,
    historyItems,
    isSaving,
    setIsSaving,
    handleSaveClick,
    handleCreateProject,
    handleCreateSnapshot,
    handleSelectHistoryItem,
    handleRestoreVersion,
    handleClosePreview,
  };
}
