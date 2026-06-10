import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTableStore } from "./store/useTableStore";
import { TableGrid } from "./components/TableGrid";
import { TableSettings } from "./components/TableSettings";
import { TablePageToolbar } from "./components/TablePageToolbar";
import { ConfirmModal } from "../../components/modals/ConfirmModal";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary";
import { TableErrorFallback } from "../../components/ui/ErrorFallbacks";
import { useUnsavedChangesWarning } from "../../hooks/useUnsavedChangesWarning";
import { useScenarioLoader } from "../../hooks/useScenarioLoader";
import { CheckCircle2, Loader2, AlertCircle, Edit3 } from "lucide-react";
import { SaveConflictBanner } from "../../components/ui/SaveConflictBanner";
import { useToastStore } from "../../store/useToastStore";
import { BackendWarningsBanner } from "../../components/ui/BackendWarningsBanner";
import { localTemplateRepository } from "../shared/templates/localTemplateRepository";

export function DecisionTablePage() {
  const resetAll = useTableStore((s) => s.resetAll);
  const isDirty = useTableStore((s) => s.isDirty);
  const loadTemplateScenario = useTableStore((s) => s.loadTemplateScenario);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const navigate = useNavigate();
  const loadError = useTableStore((s) => s.loadError);

  const currentProjectId = useTableStore((s) => s.currentProjectId);
  const isSaving = useTableStore((s) => s.isSaving);
  const saveError = useTableStore((s) => s.saveError);
  const saveConflict = useTableStore((s) => s.saveConflict);
  const saveToBackend = useTableStore((s) => s.saveToBackend);
  const isPreviewMode = useTableStore((s) => s.isPreviewMode);
  const isLoading = useTableStore((s) => s.isLoading);
  const loadCloudProject = useTableStore((s) => s.loadCloudProject);
  const backendWarnings = useTableStore((s) => s.backendWarnings);
  const analyzeWithBackend = useTableStore((s) => s.analyzeWithBackend);
  const dataVersion = useTableStore((s) => s.dataVersion);

  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
  if (!isDirty || !currentProjectId) return;

  const timer = setTimeout(() => {
    saveToBackend();
  }, 2000);

  return () => clearTimeout(timer);
}, [isDirty, dataVersion, currentProjectId, saveToBackend]);

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
    fetchFn: localTemplateRepository.getTableScenarios,
  });

  const handleResetClick = () => {
    if (isDirty) {
      setIsResetModalOpen(true);
    } else {
      resetAll();
    }
  };

  const handleRefreshFromCloud = async () => {
    await loadCloudProject(currentProjectId);

    const { loadError: latestLoadError } = useTableStore.getState();

    if (!latestLoadError) {
      useToastStore
        .getState()
        .addToast("Projekt został odświeżony z chmury.", "success");
    }
  };

  return (
    <div className="w-full min-h-full lg:h-full flex flex-col font-sans gap-4 lg:gap-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-50 w-full">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Tabela decyzyjna
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
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />{" "}
                    <span className="text-destructive">Konflikt wersji</span>
                  </>
                ) : saveError ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />{" "}
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
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed max-w-3xl">
            Wypisz cele (kryteria) i alternatywy, oceń każdą opcję i wyeliminuj
            zdominowane w rankingu, dokonuj kompromisów między celami, aż wyłoni
            się najlepsza decyzja.
          </p>
        </div>
        <TablePageToolbar
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
            Przykładowe decyzje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {scenariosList.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleTemplateClick(scenario.id)}
                className="p-4 border border-border rounded-lg bg-card hover:border-primary/50 hover:bg-primary/5 transition-colors text-left shadow-sm group flex flex-col h-full focus:outline-none focus:ring-2 focus:ring-primary/20"
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
        onDismiss={() => useTableStore.setState({ backendWarnings: [] })}
        onRetry={analyzeWithBackend}
      />
      {saveConflict && (
        <SaveConflictBanner
          currentProjectId={currentProjectId}
          onDismiss={() =>
            useTableStore.setState({
              saveError: null,
              saveConflict: false,
            })
          }
          onRefreshFromCloud={handleRefreshFromCloud}
        />
      )}

      <Card className="flex-1 overflow-auto min-h-[400px] lg:min-h-0 lg:max-h-[85vh] custom-scrollbar flex flex-col relative z-0 p-4 lg:p-6 mt-2 lg:mt-0">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm animate-in fade-in duration-200 rounded-lg">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-primary animate-pulse tracking-wide">
              Wczytywanie scenariusza...
            </p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md p-6 animate-in zoom-in-95 duration-300 rounded-lg">
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

        <div
          className={`flex flex-col flex-1 transition-all duration-300 ${isPreviewMode ? "pointer-events-none opacity-85 grayscale-[0.15]" : ""}`}
        >
          <ErrorBoundary fallback={<TableErrorFallback />} onReset={resetAll}>
            <TableGrid />
          </ErrorBoundary>

          <TableSettings />
        </div>

        <div className="mt-4 border-t border-border pt-4 flex justify-end">
          <Button
            variant="dangerGhost"
            size="sm"
            onClick={handleResetClick}
            disabled={isPreviewMode}
          >
            Resetuj wszystko
          </Button>
        </div>
      </Card>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={() => {
          resetAll();
          setIsResetModalOpen(false);
        }}
        title="Resetowanie tabeli"
        message="Czy na pewno chcesz zresetować całą tabelę i zacząć od nowa? Niezapisane dane zostaną utracone."
        variant="danger"
        confirmText="Resetuj tabelę"
      />

      <ConfirmModal
        isOpen={pendingTemplateId !== null}
        onClose={() => setPendingTemplateId(null)}
        onConfirm={confirmLoadTemplate}
        title="Nadpisanie tabeli"
        message="Załadowanie nowego szablonu usunie Twoje dotychczasowe wpisy. Czy na pewno chcesz kontynuować?"
        variant="warning"
        confirmText="Załaduj szablon"
      />
    </div>
  );
}
