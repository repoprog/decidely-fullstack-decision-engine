import React, { memo } from "react";
import { TableCell } from "./TableCell";
import { SORT_DIRECTIONS } from "../../../constants/decisionTypes";
import { ArrowDown, ArrowUp } from "lucide-react";

export const TableRow = memo(function TableRow({
  rowIndex,
  objName,
  alternatives,
  cells,
  originalCells,
  objectiveUnits,
  showRanking,
  sortDirections,
  showTradeoffs,
  hideEqualizedObjectives,
  rejectedAlternatives,
  showRejected,
  rowRanks,
  isRowEqual,
  dominationResults,
  winnerIndex,
  focusedCell,
  setFocusedCell,
  updateObjective,
  updateUnit,
  updateCell,
  toggleSortDirection,
  onRemoveObjective,
  isLastRow,
  isReadOnly,
}) {
  const isLowerBetter = sortDirections[rowIndex] === SORT_DIRECTIONS.LOWER;
  let trClass = "hover:bg-muted/20 transition-colors";

  if (isRowEqual) {
    if (hideEqualizedObjectives) trClass += " hidden";
  }

  const allRanks = Object.values(rowRanks);
  const maxRank = allRanks.length > 0 ? Math.max(...allRanks) : null;

  return (
    <tr className={trClass}>
      <td
        className={`md:sticky md:left-0 z-[11] bg-card/90 backdrop-blur-md shadow-[inset_-1px_0_0_var(--border),inset_0_-1px_0_var(--border)] px-4 py-2.5 align-middle overflow-hidden text-ellipsis ${
          isLastRow && !showRanking ? "rounded-bl-xl" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-destructive enabled:hover:text-destructive enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            onClick={() => onRemoveObjective(rowIndex)}
            title="Usuń ten cel"
            disabled={isReadOnly || showRanking}
          >
            -
          </button>
          <input
            className={`w-full py-1.5 px-2 border border-transparent bg-transparent rounded-md text-sm transition-all box-border font-medium flex-1 min-w-[100px] [&:not(:read-only)]:hover:bg-muted/50 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 text-foreground ${
              isRowEqual ? "line-through !text-muted-foreground opacity-50" : ""
            }`}
            value={objName}
            onChange={(e) => updateObjective(rowIndex, e.target.value)}
            readOnly={isReadOnly || showRanking}
            placeholder="Nazwa celu"
            title={objName}
          />
          <input
            className={`w-[60px] py-1 px-1 border border-transparent bg-transparent hover:border-dashed hover:border-border rounded text-xs transition-all box-border text-center shrink-0 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:border-solid [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 text-muted-foreground ${
              isRowEqual ? "line-through !text-muted-foreground opacity-50" : ""
            }`}
            placeholder="np. zł"
            value={objectiveUnits[rowIndex] || ""}
            onChange={(e) => updateUnit(rowIndex, e.target.value)}
            readOnly={isReadOnly || showRanking}
            title="Dodaj jednostkę (np. zł, m², min)"
            list="unit-suggestions"
          />
          <button
            className="shrink-0 w-[60px] h-[24px] flex justify-center items-center cursor-pointer px-1 border-none rounded bg-green-100 text-[11px] leading-none font-bold text-green-800 whitespace-nowrap transition-all enabled:hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground font-sans dark:bg-green-900/30 dark:text-green-400"
            onClick={() => toggleSortDirection(rowIndex)}
            title={
              isLowerBetter
                ? "Ustaw wyższą wartość jako lepszą"
                : "Ustaw niższą wartość jako lepszą"
            }
            disabled={isReadOnly || showRanking}
          >
            <span className="inline-flex items-center gap-0.5">
              {isLowerBetter ? (
                <ArrowDown className="w-3.5 h-3.5" />
              ) : (
                <ArrowUp className="w-3.5 h-3.5" />
              )}
              <span>lepiej</span>
            </span>
          </button>
        </div>
      </td>

      {alternatives.map((_, colIndex) => {
        const cellKey = `${rowIndex}-${colIndex}`;
        const cellValue = cells[cellKey];
        const hasCellValue =
          cellValue !== undefined &&
          cellValue !== null &&
          cellValue.toString().trim() !== "";

        const isCellEqualized = isRowEqual && hasCellValue;

        return (
          <TableCell
            key={cellKey}
            rowIndex={rowIndex}
            colIndex={colIndex}
            unit={objectiveUnits[rowIndex] || ""}
            rankVal={rowRanks[colIndex]}
            maxRank={maxRank}
            isWinner={winnerIndex === colIndex}
            isRejected={rejectedAlternatives.includes(colIndex)}
            domType={
              showRanking && dominationResults[colIndex]
                ? dominationResults[colIndex].type
                : null
            }
            isCellEqualized={isCellEqualized}
            showRanking={showRanking}
            showRejected={showRejected}
            showTradeoffs={showTradeoffs}
            isLastRow={isLastRow}
            isLastCol={colIndex === alternatives.length - 1}
            isFocused={focusedCell === cellKey}
            setFocusedCell={setFocusedCell}
            cells={cells}
            originalCells={originalCells}
            updateCell={updateCell}
            isReadOnly={isReadOnly}
          />
        );
      })}
    </tr>
  );
});
