import { useState, useEffect, useCallback } from "react";
import { useReactFlow, getNodesBounds } from "@xyflow/react";
import { useTreeStore, useTemporalTreeStore } from "../store/useTreeStore.js";
import {
  FolderOpen,
  Save,
  Image as ImageIcon,
  FileText,
  Undo2,
  Redo2,
  Maximize,
  Minimize,
  Share2,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { useJsonExportImport } from "../../../hooks/useJsonExportImport";
import { useToastStore } from "../../../store/useToastStore";
import { ShareModal } from "../../../components/modals/ShareModal.jsx";
import { exportGraph } from "../logic/treeExportUtils.js";

export function TreeToolbar() {
  const undo = useTemporalTreeStore((state) => state.undo);
  const redo = useTemporalTreeStore((state) => state.redo);
  const pastStates = useTemporalTreeStore((state) => state.pastStates);
  const futureStates = useTemporalTreeStore((state) => state.futureStates);
  const addToast = useToastStore((state) => state.addToast);
  const isPreviewMode = useTreeStore((state) => state.isPreviewMode);
  const currentProjectId = useTreeStore((state) => state.currentProjectId);

  const { getNodes, setViewport, getViewport } = useReactFlow();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const handleUndo = useCallback(() => {
    if (useTreeStore.getState().isPreviewMode) {
      return;
    }

    undo();

    useTreeStore.setState((state) => ({
      isDirty: true,
      dataVersion: state.dataVersion + 1,
    }));
  }, [undo]);

  const handleRedo = useCallback(() => {
    if (useTreeStore.getState().isPreviewMode) {
      return;
    }

    redo();

    useTreeStore.setState((state) => ({
      isDirty: true,
      dataVersion: state.dataVersion + 1,
    }));
  }, [redo]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTagName = event.target.tagName;

      if (targetTagName === "INPUT" || targetTagName === "TEXTAREA") {
        return;
      }

      if (useTreeStore.getState().isPreviewMode) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          if (canRedo) {
            handleRedo();
          }

          return;
        }

        if (canUndo) {
          handleUndo();
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();

        if (canRedo) {
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, canUndo, canRedo]);

  const toggleFullscreen = () => {
    const canvasContainer = document.getElementById("tree-canvas-container");

    if (!canvasContainer) {
      return;
    }

    if (!document.fullscreenElement) {
      canvasContainer.requestFullscreen().catch(() => {});
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const { fileInputRef, handleExport, handleImportClick, handleFileChange } =
    useJsonExportImport({
      filename: "drzewo-decyzyjne.json",

      buildExportData: () => {
        const state = useTreeStore.getState();

        return {
          type: "DecisionTree",
          nodes: state.nodes,
          edges: state.edges,
          labels: state.stageColumnLabels || [],
          evaluationMode: state.evaluationMode,
        };
      },

      onImport: (parsedData) => {
        if (useTreeStore.getState().isPreviewMode) {
          return;
        }

        const success = useTreeStore.getState().importData(parsedData);

        if (success) {
          addToast("Drzewo zostało wczytane poprawnie.", "success");
          return;
        }

        addToast(
          "To nie wygląda na poprawny plik Drzewa Decyzyjnego.",
          "error",
        );
      },

      onError: (message) => addToast(message, "error"),
    });

  const handleImageExport = (format) => {
    exportGraph({
      format,
      getNodes,
      getNodesBounds,
      getViewport,
      setViewport,
      addToast,
    });
  };

  const handleShareClick = () => {
    if (!currentProjectId) {
      addToast(
        "Aby udostępnić projekt, musisz najpierw zapisać go w chmurze.",
        "warning",
      );
      return;
    }

    setIsShareModalOpen(true);
  };

  return (
    <>
      <div className="tree-toolbar-export absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleUndo}
          disabled={!canUndo || isPreviewMode}
          title="Cofnij (Ctrl+Z)"
        >
          <Undo2 className="w-[18px] h-[18px]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRedo}
          disabled={!canRedo || isPreviewMode}
          title="Ponów (Ctrl+Y)"
        >
          <Redo2 className="w-[18px] h-[18px]" />
        </Button>

        <div className="mx-1.5 h-5 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Zamknij pełny ekran" : "Pełny ekran (F11)"}
        >
          {isFullscreen ? (
            <Minimize className="w-[18px] h-[18px]" />
          ) : (
            <Maximize className="w-[18px] h-[18px]" />
          )}
        </Button>

        <div className="mx-1.5 h-5 w-px bg-border" />

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isPreviewMode) {
              return;
            }

            handleImportClick();
          }}
          disabled={isPreviewMode}
          title="Wczytaj decyzję z pliku (JSON)"
        >
          <FolderOpen className="w-[18px] h-[18px] text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleExport}
          title="Zapisz decyzję jako plik (JSON)"
        >
          <Save className="w-[18px] h-[18px] text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShareClick}
          disabled={isPreviewMode}
          title="Udostępnij projekt jako link tylko do odczytu"
        >
          <Share2 className="w-[18px] h-[18px] text-muted-foreground" />
        </Button>

        <div className="mx-1.5 h-5 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleImageExport("png")}
          title="Pobierz jako obraz (PNG)"
        >
          <ImageIcon className="w-[18px] h-[18px] text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleImageExport("pdf")}
          title="Pobierz jako dokument (PDF)"
        >
          <FileText className="w-[18px] h-[18px] text-muted-foreground" />
        </Button>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={currentProjectId}
      />
    </>
  );
}
