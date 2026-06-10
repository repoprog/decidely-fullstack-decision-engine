import React, { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Eye, EyeOff } from "lucide-react";
import { ConfirmModal } from "../../../components/modals/ConfirmModal";
import { DOMINATION_TYPES } from "../../../constants/decisionTypes";
import { getRowRanks, getTradeoffResults } from "../logic/tableLogic";
import { useTableStore } from "../store/useTableStore";
import { TableConclusions } from "./TableConclusions";
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

const noop = () => {};

function mapBackendResultsToLocal(backendResult, context) {
  const { results, winnerIndex } = backendResult;
  const dominationResults = {};

  Object.entries(results || {}).forEach(([colIdx, dto]) => {
    if (dto.domination) {
      dominationResults[Number(colIdx)] = {
        type:
          dto.domination.type === "STRICT"
            ? DOMINATION_TYPES.STRICT
            : DOMINATION_TYPES.PRACTICAL,
        by: dto.domination.dominatedByName || "",
        objective: dto.domination.exceptionalCriterionName || "",
      };
    }
  });

  const completeAlts = Object.entries(results || {})
    .filter(([, dto]) => dto.isComplete)
    .map(([idx]) => Number(idx));

  const localPartial = getTradeoffResults(context);

  return {
    dominationResults,
    winnerIndex: winnerIndex ?? null,
    completeAlts,
    equalizedRowsIndexes: localPartial.equalizedRowsIndexes,
    equalizedCount: localPartial.equalizedCount,
  };
}

export function TableGrid({ readOnlyData = null, readOnlyShowRanking = true }) {
  const isReadOnly = !!readOnlyData;

  const {
    storeAlternatives,
    storeObjectives,
    storeCells,
    storeOriginalCells,
    storeObjectiveUnits,
    storeSortDirections,
    storeShowRanking,
    showTradeoffs,
    hideEqualizedObjectives,
    rejectedAlternatives,
    showRejected,
    customScales,
    backendAnalysisResult,
    toggleShowRejected,
    toggleHideEqualized,
    toggleSortDirection,
    addAlternative,
    addObjective,
    updateAlternative,
    updateObjective,
    updateUnit,
    updateCell,
    rejectAlternative,
    restoreAlternative,
    removeAlternative,
    removeObjective,
    toggleTradeoffs,
  } = useTableStore(
    useShallow((state) => ({
      storeAlternatives: state.alternatives,
      storeObjectives: state.objectives,
      storeCells: state.cells,
      storeOriginalCells: state.originalCells,
      storeObjectiveUnits: state.objectiveUnits,
      storeSortDirections: state.sortDirections,
      storeShowRanking: state.showRanking,
      showTradeoffs: state.showTradeoffs,
      hideEqualizedObjectives: state.hideEqualizedObjectives,
      rejectedAlternatives: state.rejectedAlternatives,
      showRejected: state.showRejected,
      customScales: state.customScales,
      backendAnalysisResult: state.backendAnalysisResult,
      toggleShowRejected: state.toggleShowRejected,
      toggleHideEqualized: state.toggleHideEqualized,
      toggleSortDirection: state.toggleSortDirection,
      addAlternative: state.addAlternative,
      addObjective: state.addObjective,
      updateAlternative: state.updateAlternative,
      updateObjective: state.updateObjective,
      updateUnit: state.updateUnit,
      updateCell: state.updateCell,
      rejectAlternative: state.rejectAlternative,
      restoreAlternative: state.restoreAlternative,
      removeAlternative: state.removeAlternative,
      removeObjective: state.removeObjective,
      toggleTradeoffs: state.toggleTradeoffs,
    })),
  );

  const [focusedCell, setFocusedCell] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const alternatives = isReadOnly
    ? readOnlyData.alternatives || EMPTY_ARRAY
    : storeAlternatives;

  const objectives = isReadOnly
    ? readOnlyData.objectives || EMPTY_ARRAY
    : storeObjectives;

  const cells = isReadOnly ? readOnlyData.cells || EMPTY_OBJECT : storeCells;

  const originalCells = isReadOnly ? EMPTY_OBJECT : storeOriginalCells;

  const objectiveUnits = isReadOnly
    ? readOnlyData.objectiveUnits || EMPTY_OBJECT
    : storeObjectiveUnits;

  const sortDirections = isReadOnly
    ? readOnlyData.sortDirections || EMPTY_OBJECT
    : storeSortDirections;

  const showRanking = isReadOnly ? readOnlyShowRanking : storeShowRanking;

  const effectiveShowRejected = isReadOnly ? false : showRejected;
  const effectiveHideEqualizedObjectives = isReadOnly
    ? false
    : hideEqualizedObjectives;

  const analysisContext = useMemo(
    () => ({
      alternatives,
      objectives,
      cells,
      objectiveUnits,
      sortDirections,
      showRanking,
      showTradeoffs,
      hideEqualizedObjectives: effectiveHideEqualizedObjectives,
      rejectedAlternatives,
      showRejected: effectiveShowRejected,
      customScales,
    }),
    [
      alternatives,
      objectives,
      cells,
      objectiveUnits,
      sortDirections,
      showRanking,
      showTradeoffs,
      effectiveHideEqualizedObjectives,
      rejectedAlternatives,
      effectiveShowRejected,
      customScales,
    ],
  );

  const localResults = useMemo(
    () => getTradeoffResults(analysisContext),
    [analysisContext],
  );

  const rowRanksByIndex = useMemo(() => {
    return objectives.map((_, rowIndex) =>
      getRowRanks(rowIndex, analysisContext),
    );
  }, [objectives, analysisContext]);

  const activeBackendResult = isReadOnly
    ? readOnlyData.backendAnalysisResult
    : backendAnalysisResult;

  const {
    equalizedRowsIndexes,
    equalizedCount,
    dominationResults,
    winnerIndex,
    completeAlts,
  } = activeBackendResult
    ? mapBackendResultsToLocal(activeBackendResult, analysisContext)
    : localResults;

  const closeConfirmModal = () => {
    setModalConfig((current) => ({
      ...current,
      isOpen: false,
    }));
  };

  const handleRemoveAlternative = (indexToRemove) => {
    if (isReadOnly) {
      return;
    }

    const hasData = objectives.some((_, rowIndex) => {
      const value = cells[`${rowIndex}-${indexToRemove}`];
      return (
        value !== undefined && value !== null && value.toString().trim() !== ""
      );
    });

    if (hasData) {
      setModalConfig({
        isOpen: true,
        title: "Usuwanie alternatywy",
        message: `Alternatywa "${alternatives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz ją usunąć?`,
        onConfirm: () => removeAlternative(indexToRemove),
      });
      return;
    }

    removeAlternative(indexToRemove);
  };

  const handleRemoveObjective = (indexToRemove) => {
    if (isReadOnly) {
      return;
    }

    const hasData = alternatives.some((_, colIndex) => {
      const value = cells[`${indexToRemove}-${colIndex}`];
      return (
        value !== undefined && value !== null && value.toString().trim() !== ""
      );
    });

    if (hasData) {
      setModalConfig({
        isOpen: true,
        title: "Usuwanie celu",
        message: `Cel "${objectives[indexToRemove]}" zawiera wpisane dane. Czy na pewno chcesz go usunąć?`,
        onConfirm: () => removeObjective(indexToRemove),
      });
      return;
    }

    removeObjective(indexToRemove);
  };

  const readOnlyClasses = isReadOnly
    ? "[&_input]:pointer-events-none [&_input]:!bg-transparent [&_button]:hidden [&_button.flex]:flex"
    : "";

  return (
    <div className={`w-full pb-6 ${readOnlyClasses}`}>
      <div
        className={`relative isolate rounded-xl transition-all duration-500 border border-border bg-card shadow-sm overflow-hidden ${
          showTradeoffs
            ? "ring-2 ring-purple-500 z-20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            : ""
        }`}
      >
        <div className="overflow-x-auto w-full">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[320px] md:w-[385px]" />
              {alternatives.map((_, index) => (
                <col
                  key={index}
                  className={`min-w-[150px] ${
                    rejectedAlternatives.includes(index) &&
                    !effectiveShowRejected
                      ? "hidden"
                      : ""
                  }`}
                />
              ))}
            </colgroup>

            <TableHeader
              objectives={objectives}
              alternatives={alternatives}
              showRanking={showRanking}
              dominationResults={dominationResults}
              rejectedAlternatives={rejectedAlternatives}
              showRejected={effectiveShowRejected}
              winnerIndex={winnerIndex}
              addObjective={addObjective}
              addAlternative={addAlternative}
              updateAlternative={updateAlternative}
              onRemoveAlternative={handleRemoveAlternative}
            />

            <tbody>
              {objectives.map((objName, rowIndex) => (
                <TableRow
                  key={`row-${rowIndex}`}
                  rowIndex={rowIndex}
                  objName={objName}
                  alternatives={alternatives}
                  cells={cells}
                  originalCells={originalCells}
                  objectiveUnits={objectiveUnits}
                  showRanking={showRanking}
                  sortDirections={sortDirections}
                  showTradeoffs={showTradeoffs}
                  hideEqualizedObjectives={effectiveHideEqualizedObjectives}
                  rejectedAlternatives={rejectedAlternatives}
                  showRejected={effectiveShowRejected}
                  rowRanks={rowRanksByIndex[rowIndex]}
                  isRowEqual={equalizedRowsIndexes.includes(rowIndex)}
                  dominationResults={dominationResults}
                  winnerIndex={winnerIndex}
                  focusedCell={focusedCell}
                  setFocusedCell={setFocusedCell}
                  updateObjective={updateObjective}
                  updateUnit={updateUnit}
                  updateCell={updateCell}
                  toggleSortDirection={toggleSortDirection}
                  onRemoveObjective={handleRemoveObjective}
                  isLastRow={rowIndex === objectives.length - 1}
                  isReadOnly={isReadOnly}
                />
              ))}

              <TableConclusions
                alternatives={alternatives}
                objectives={objectives}
                cells={cells}
                showRanking={showRanking}
                dominationResults={dominationResults}
                rejectedAlternatives={rejectedAlternatives}
                showRejected={effectiveShowRejected}
                winnerIndex={winnerIndex}
                completeAlts={completeAlts}
                restoreAlternative={isReadOnly ? noop : restoreAlternative}
                rejectAlternative={isReadOnly ? noop : rejectAlternative}
                toggleTradeoffs={isReadOnly ? noop : toggleTradeoffs}
              />
            </tbody>
          </table>
        </div>
      </div>

      {!isReadOnly && (
        <div className="mt-4 flex justify-between items-center px-1">
          <div />

          <div className="flex gap-3">
            {equalizedCount > 0 && (
              <button
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={isReadOnly ? undefined : toggleHideEqualized}
              >
                {hideEqualizedObjectives ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                {hideEqualizedObjectives
                  ? `Pokaż wyrównane cele (${equalizedCount})`
                  : `Ukryj wyrównane cele (${equalizedCount})`}
              </button>
            )}

            {rejectedAlternatives.length > 0 && (
              <button
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={isReadOnly ? undefined : toggleShowRejected}
              >
                {showRejected ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
                {showRejected
                  ? `Ukryj odrzucone opcje (${rejectedAlternatives.length})`
                  : `Pokaż odrzucone opcje (${rejectedAlternatives.length})`}
              </button>
            )}
          </div>
        </div>
      )}

      <datalist id="scale-suggestions">
        {customScales.map((scale, index) => (
          <option key={index} value={scale.word} />
        ))}
      </datalist>

      <datalist id="unit-suggestions">
        <option value="zł" />
        <option value="$" />
        <option value="€" />
        <option value="m²" />
        <option value="m" />
        <option value="km" />
        <option value="kg" />
        <option value="min" />
        <option value="h" />
        <option value="%" />
        <option value="szt." />
      </datalist>

      {!isReadOnly && (
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          onClose={closeConfirmModal}
          onConfirm={() => {
            if (modalConfig.onConfirm) {
              modalConfig.onConfirm();
            }
          }}
          title={modalConfig.title}
          message={modalConfig.message}
          variant="danger"
          confirmText="Usuń"
        />
      )}
    </div>
  );
}
