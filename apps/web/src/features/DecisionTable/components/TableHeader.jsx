import { DOMINATION_TYPES } from "../../../constants/decisionTypes";
import { useState } from "react";

const getPluralForm = (count, [singular, few, many]) => {
  if (count === 1) return singular;

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }

  return many;
};

export function TableHeader({
  objectives,
  alternatives,
  showRanking,
  dominationResults,
  rejectedAlternatives,
  showRejected,
  winnerIndex,
  addObjective,
  addAlternative,
  updateAlternative,
  onRemoveAlternative,
}) {
  const [draftAlternativeNames, setDraftAlternativeNames] = useState({});

  const objectivesText = getPluralForm(objectives.length, [
    "Cel",
    "Cele",
    "Celów",
  ]);
  const alternativesText = getPluralForm(alternatives.length, [
    "Alternatywa",
    "Alternatywy",
    "Alternatyw",
  ]);

  return (
    <thead>
      <tr>
        <th className="text-center md:sticky md:left-0 md:top-0 z-[30] bg-muted/90 backdrop-blur-md shadow-[inset_-1px_-1px_0_var(--border)] px-4 py-3 align-middle font-semibold text-muted-foreground text-[13px] uppercase tracking-wide rounded-tl-xl">
          <div className="flex justify-center items-center gap-2.5 text-muted-foreground text-xs font-medium whitespace-nowrap">
            {objectives.length === 0 && (
              <span className="inline-flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-primary/30">
                Dodaj cel →
              </span>
            )}
            <button
              className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-primary/50 enabled:hover:text-foreground enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              onClick={addObjective}
              title="Dodaj cel"
              disabled={showRanking}
            >
              +
            </button>

            <span>
              {objectives.length} {objectivesText} / {alternatives.length}{" "}
              {alternativesText}
            </span>

            <button
              className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-7 h-7 rounded-lg text-lg leading-none enabled:hover:border-primary/50 enabled:hover:text-foreground enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              onClick={addAlternative}
              title="Dodaj alternatywę"
              disabled={showRanking}
            >
              +
            </button>
            {alternatives.length === 0 && (
              <span className="inline-flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-primary/30">
                ← Dodaj opcję
              </span>
            )}
          </div>
        </th>

        {alternatives.map((alt, colIndex) => {
          const domType =
            showRanking && dominationResults[colIndex]
              ? dominationResults[colIndex].type
              : null;
          const isRejected = rejectedAlternatives.includes(colIndex);
          const isWinner = winnerIndex === colIndex;
          const isLastHeader = colIndex === alternatives.length - 1;

          let headerColor = "text-foreground";
          if (isWinner) headerColor = "text-green-700 dark:text-green-500";
          else if (domType === DOMINATION_TYPES.STRICT)
            headerColor = "text-red-600 dark:text-red-400";
          else if (domType === DOMINATION_TYPES.PRACTICAL)
            headerColor = "text-amber-600 dark:text-amber-400";

          const winnerClasses = isWinner
            ? "bg-green-100/80 dark:bg-green-900/10"
            : "";

          const displayValue =
            draftAlternativeNames[colIndex] !== undefined
              ? draftAlternativeNames[colIndex]
              : alt;

          return (
            <th
              key={`col-${colIndex}`}
              className={`p-1.5 align-middle overflow-hidden text-ellipsis md:sticky md:top-0 z-[20] shadow-[inset_0_-1px_0_var(--border),inset_-1px_0_0_var(--border)] bg-muted/90 backdrop-blur-md ${isRejected && !showRejected ? "hidden" : ""} ${isRejected && showRejected ? "opacity-40" : ""} ${winnerClasses} ${isLastHeader ? "rounded-tr-xl" : ""}`}
              title={alt}
            >
              <div className="flex items-center justify-center gap-1">
                <input
                  className={`w-full py-2 px-1 border border-transparent bg-transparent rounded-md text-sm transition-all box-border [&:not(:read-only)]:hover:bg-card/80 [&:not(:read-only)]:focus:outline-none [&:not(:read-only)]:focus:bg-card [&:not(:read-only)]:focus:border-primary [&:not(:read-only)]:focus:ring-2 [&:not(:read-only)]:focus:ring-primary/20 uppercase font-bold tracking-wide text-center ${headerColor}`}
                  value={displayValue}
                  onChange={(e) =>
                    setDraftAlternativeNames((prev) => ({
                      ...prev,
                      [colIndex]: e.target.value,
                    }))
                  }
                  onBlur={() => {
                    if (draftAlternativeNames[colIndex] !== undefined) {
                      updateAlternative(
                        colIndex,
                        draftAlternativeNames[colIndex],
                      );
                      setDraftAlternativeNames((prev) => {
                        const next = { ...prev };
                        delete next[colIndex];
                        return next;
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  disabled={showRanking}
                />
                <button
                  className="inline-flex justify-center items-center bg-card text-muted-foreground font-bold cursor-pointer transition-all border border-border w-[22px] h-[22px] rounded-full text-sm leading-none enabled:hover:border-destructive enabled:hover:text-destructive enabled:hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  onClick={() => onRemoveAlternative(colIndex)}
                  title="Usuń tę alternatywę"
                  disabled={showRanking}
                >
                  -
                </button>
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
