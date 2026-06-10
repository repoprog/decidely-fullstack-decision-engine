import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTreeStore } from "./store/useTreeStore.js";
import { useToastStore } from "../../store/useToastStore";
import { TreeCanvas } from "./components/TreeCanvas.jsx";
import { TreePageToolbar } from "./components/TreePageToolbar.jsx";
import { ConfirmModal } from "../../components/modals/ConfirmModal.jsx";
import { Card } from "../../components/ui/Card";
import { Lock, CheckCircle2, Loader2, AlertCircle, Edit3 } from "lucide-react";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary";
import { TreeErrorFallback } from "../../components/ui/ErrorFallbacks";
import { useUnsavedChangesWarning } from "../../hooks/useUnsavedChangesWarning";
import { useScenarioLoader } from "../../hooks/useScenarioLoader";
import { Button } from "../../components/ui/Button";
import { BackendWarningsBanner } from "../../components/ui/BackendWarningsBanner";
import { SaveConflictBanner } from "../../components/ui/SaveConflictBanner";
import { localTemplateRepository } from "../shared/templates/localTemplateRepository";

export function DecisionTreePage() {
  const resetTree = useTreeStore((s) => s.resetTree);
  const isDirty = useTreeStore((s) => s.isDirty);
  const loadTemplateScenario = useTreeStore((s) => s.loadTemplateScenario);
  const navigate = useNavigate();
  const loadError = useTreeStore((s) => s.loadError);

  const currentProjectId = useTreeStore((s) => s.currentProjectId);
  const isSaving = useTreeStore((s) => s.isSaving);
  const saveError = useTreeStore((s) => s.saveError);
  const saveConflict = useTreeStore((s) => s.saveConflict);
  const saveToBackend = useTreeStore((s) => s.saveToBackend);
  const isPreviewMode = useTreeStore((s) => s.isPreviewMode);
  const backendWarnings = useTreeStore((s) => s.backendWarnings);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const isLoading = useTreeStore((s) => s.isLoading);
  const analyzeWithBackend = useTreeStore((s) => s.analyzeWithBackend);
  const loadCloudProject = useTreeStore((s) => s.loadCloudProject);
  const dataVersion = useTreeStore((state) => state.dataVersion);

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (!isDirty || !currentProjectId) return;

    const timer = setTimeout(() => {
      saveToBackend();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isDirty, dataVersion, currentProjectId, saveToBackend]);

  const handleResetClick = () => {
    if (isDirty) {
      setIsResetModalOpen(true);
    } else {
      resetTree();
    }
  };

  const {
    showTemplates,
    setShowTemplates,
    scenariosList,
    pendingTemplateId,
    setPendingTemplateId,
    handleTemplateClick,
    confirmLoadTemplate,
  } = useScenarioLoader({
    isDirty,
    loadFn: loadTemplateScenario,
    fetchFn: localTemplateRepository.getTreeScenarios,
  });

  const handleRefreshFromCloud = async () => {
    await loadCloudProject(currentProjectId);

    const { loadError: latestLoadError } = useTreeStore.getState();

    if (!latestLoadError) {
      useToastStore
        .getState()
        .addToast("Projekt został odświeżony z chmury.", "success");
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 lg:gap-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-50 w-full">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Drzewo decyzyjne
            </h2>

            {currentProjectId && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-muted/30 rounded-full border border-border text-xs font-medium transition-all">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />{" "}
                    <span className="text-muted-foreground">
                      Zapisywanie...
                    </span>
                  </>
                ) : saveConflict ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-destructive">Konflikt wersji</span>
                  </>
                ) : saveError ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-destructive">Błąd zapisu</span>
                  </>
                ) : isDirty ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-amber-500" />{" "}
                    <span className="text-amber-500">Niezapisane zmiany</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />{" "}
                    <span className="text-emerald-500">Zapisano w chmurze</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="text-muted-foreground mt-1 text-sm flex flex-wrap items-center gap-1 leading-relaxed">
            <span>
              Najedź na węzeł, aby dodać gałąź. Zmieniaj prawdopodobieństwa i
              obserwuj wyniki w czasie rzeczywistym{" "}
            </span>
          </div>
        </div>

        <TreePageToolbar
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
        />
      </div>

      {showTemplates && (
        <Card
          noPadding
          className="p-4 bg-muted/20 animate-in fade-in slide-in-from-top-2 relative z-10"
        >
          <h3 className="font-medium mb-3 text-sm text-foreground">
            Predefiniowane szablony
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenariosList.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleTemplateClick(scenario.id)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="font-medium mb-1 text-foreground group-hover:text-primary transition-colors">
                  {scenario.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {scenario.description || "Brak opisu"}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
      <BackendWarningsBanner
        warnings={backendWarnings}
        onDismiss={() => useTreeStore.setState({ backendWarnings: [] })}
        onRetry={analyzeWithBackend}
      />
      <Card
        noPadding
        className="flex-1 h-full min-h-[400px] lg:min-h-[600px] overflow-hidden relative z-0 flex flex-col mt-2 lg:mt-0"
      >
        {saveConflict && (
          <SaveConflictBanner
            currentProjectId={currentProjectId}
            onDismiss={() =>
              useTreeStore.setState({
                saveError: null,
                saveConflict: false,
              })
            }
            onRefreshFromCloud={handleRefreshFromCloud}
          />
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 animate-pulse tracking-wide">
              Pobieranie symulacji...
            </p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6 animate-in zoom-in-95 duration-300">
            <Card className="max-w-md w-full border-destructive/30 bg-destructive/5 p-8 flex flex-col items-center text-center gap-4 shadow-2xl">
              <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Błąd ładowania decyzji
                </h3>
                <p className="text-sm text-muted-foreground">{loadError}</p>
              </div>
              <Button
                variant="default"
                onClick={() => navigate("/app/panel")}
                className="mt-4 w-full sm:w-auto px-8"
              >
                Wróć do panelu
              </Button>
            </Card>
          </div>
        )}

        <ErrorBoundary fallback={<TreeErrorFallback />} onReset={resetTree}>
          <TreeCanvas />
        </ErrorBoundary>
        <div className="absolute bottom-6 right-6 z-50">
          <Button
            variant="dangerGhost"
            size="sm"
            onClick={handleResetClick}
            disabled={isPreviewMode}
            className="bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-destructive/10"
          >
            Wyczyść planszę
          </Button>
        </div>
      </Card>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetTree();
          setIsResetModalOpen(false);
        }}
        title="Czyszczenie obszaru"
        message="Czy na pewno chcesz zresetować całe drzewo i zacząć od nowa? Niezapisane dane zostaną utracone."
        variant="danger"
        confirmText="Wyczyść drzewo"
      />

      <ConfirmModal
        isOpen={pendingTemplateId !== null}
        onClose={() => setPendingTemplateId(null)}
        onConfirm={confirmLoadTemplate}
        title="Nadpisanie drzewa"
        message="Załadowanie nowego szablonu usunie Twoje obecne drzewo. Czy na pewno chcesz kontynuować?"
        variant="warning"
        confirmText="Załaduj szablon"
      />
    </div>
  );
}
