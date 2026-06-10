import React, { useState } from "react";
import { useTableStore } from "../store/useTableStore";
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  FolderOpen,
  Save,
  Share2,
} from "lucide-react";
import { scalePresets } from "../data/scalePresets";
import { ConfirmModal } from "../../../components/modals/ConfirmModal.jsx";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { useJsonExportImport } from "../../../hooks/useJsonExportImport";
import { useToastStore } from "../../../store/useToastStore";
import { ShareModal } from "../../../components/modals/ShareModal.jsx";

export function TableSettings() {
  const presetKeys = Object.keys(scalePresets);
  const [showScalesSettings, setShowScalesSettings] = useState(false);
  const [newScaleWord, setNewScaleWord] = useState("");
  const [newScaleRank, setNewScaleRank] = useState("");

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const addToast = useToastStore((s) => s.addToast);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const {
    customScales,
    activePreset,
    loadPreset,
    addScale,
    removeScale,
    clearScales,
    currentProjectId,
  } = useTableStore();

  const { fileInputRef, handleExport, handleImportClick, handleFileChange } =
    useJsonExportImport({
      filename: "tabela-decyzyjna.json",
      buildExportData: () => {
        const state = useTableStore.getState();
        return {
          name: "Moja Tabela Decyzyjna",
          description: "Zapisana sesja z aplikacji.",
          alternatives: state.alternatives,
          objectives: state.objectives,
          cells: state.cells,
          objectiveUnits: state.objectiveUnits,
          sortDirections: state.sortDirections,
          customScales: state.customScales,
          activePreset: state.activePreset,
          rejectedAlternatives: state.rejectedAlternatives,
        };
      },
      onImport: (parsedData) => {
        const success = useTableStore.getState().importData(parsedData);

        if (success) {
          addToast("Tabela została wczytana poprawnie.", "success");
        } else {
          addToast(
            "To nie wygląda na poprawny plik Tabeli Decyzyjnej.",
            "error",
          );
        }
      },
      onError: (msg) => addToast(msg, "error"),
    });

  const handleAddScale = () => {
    const word = newScaleWord.trim();
    const rank = newScaleRank.trim();

    if (!word || !rank) {
      addToast("Podaj nazwę i wagę oceny.", "warning");
      return;
    }

    addScale(word, rank);
    setNewScaleWord("");
    setNewScaleRank("");
  };

  const executeClearScales = () => {
    clearScales();
    setIsClearModalOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-start w-full mb-2">
        <div className="relative z-20">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowScalesSettings(!showScalesSettings)}
          >
            <Settings2 className="w-4 h-4 mr-2 text-muted-foreground" />
            Oceny
            {showScalesSettings ? (
              <ChevronUp className="w-4 h-4 ml-1 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1 text-muted-foreground" />
            )}
          </Button>

          {showScalesSettings && (
            <Card className="absolute left-0 top-full mt-2 space-y-6 max-w-[1000px] w-max p-5 animate-in fade-in slide-in-from-top-2 shadow-xl border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Gotowe pakiety ocen
                </h3>
                <div className="flex flex-wrap items-center gap-2 w-full">
                  {presetKeys.map((presetKey) => (
                    <Badge
                      key={presetKey}
                      variant={
                        activePreset === presetKey ? "active" : "interactive"
                      }
                      onClick={() => loadPreset(presetKey)}
                    >
                      {presetKey}
                    </Badge>
                  ))}

                  <Button
                    variant="dangerGhost"
                    size="sm"
                    className="rounded-full h-7 px-3 text-xs ml-auto"
                    onClick={() => setIsClearModalOpen(true)}
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" />
                    Wyczyść listę
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Twoje aktywne oceny
                </h3>
                {customScales.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customScales.map((scale, index) => (
                      <Badge key={index} variant="primary" className="pr-1">
                        <span>
                          {scale.word}
                          <span className="opacity-50 ml-1 font-normal tracking-tight">
                            → {scale.rank}
                          </span>
                        </span>
                        <button
                          className="hover:bg-primary/20 rounded-full p-0.5 ml-1 transition-colors focus:outline-none"
                          onClick={() => removeScale(index)}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Brak aktywnych ocen tekstowych. Dodaj je poniżej lub wybierz
                    pakiet.
                  </p>
                )}
              </div>

              <div className="pt-5 border-t border-border border-dashed">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Dodaj własną ocenę
                </h3>
                <div className="inline-flex items-center bg-background border border-border rounded-full pl-4 pr-1 py-1 focus-within:border-primary transition-colors">
                  <input
                    placeholder="Nazwa (np. premium)"
                    value={newScaleWord}
                    onChange={(e) => setNewScaleWord(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddScale()}
                    className="bg-transparent border-none outline-none text-sm w-[160px] text-foreground placeholder:text-muted-foreground"
                  />

                  <div className="w-px h-4 bg-border mx-2 shrink-0" />

                  <input
                    placeholder="Waga (np. 5)"
                    type="number"
                    value={newScaleRank}
                    onChange={(e) => setNewScaleRank(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddScale()}
                    className="bg-transparent border-none outline-none text-sm w-[120px] text-center text-foreground placeholder:text-muted-foreground"
                  />

                  <Button
                    variant="default"
                    size="circleSm"
                    className="shrink-0 ml-1"
                    onClick={handleAddScale}
                    title="Dodaj ocenę"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex items-center gap-1 z-10">
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
            className="relative"
            onClick={handleImportClick}
            title="Wczytaj decyzję z pliku (JSON)"
          >
            <FolderOpen className="w-[18px] h-[18px] text-muted-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={handleExport}
            title="Pobierz plik (JSON)"
          >
            <Save className="w-[18px] h-[18px] text-muted-foreground" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!currentProjectId) {
                addToast(
                  "Aby udostępnić projekt, musisz najpierw zapisać go w chmurze.",
                  "warning",
                );
                return;
              }
              setIsShareModalOpen(true);
            }}
            title="Udostępnij projekt jako link (Read-Only)"
          >
            <Share2 className="w-[18px] h-[18px] text-muted-foreground" />
          </Button>
        </div>

        <ConfirmModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirm={executeClearScales}
          title="Czyszczenie listy ocen"
          message="Czy na pewno chcesz wyczyścić listę słów dla tej oceny? Własne oceny zostaną bezpowrotnie usunięte."
          variant="danger"
          confirmText="Wyczyść"
        />
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={currentProjectId}
      />
    </>
  );
}
