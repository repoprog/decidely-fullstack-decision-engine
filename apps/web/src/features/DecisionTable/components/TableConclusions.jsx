import React from "react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { useToastStore } from "../../../store/useToastStore";
import {
  Trophy,
  Info,
  ArrowRightLeft,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { DOMINATION_TYPES } from "../../../constants/decisionTypes";

export function TableConclusions({
  alternatives,
  objectives,
  cells,
  showRanking,
  dominationResults,
  rejectedAlternatives,
  showRejected,
  winnerIndex,
  completeAlts,
  restoreAlternative,
  rejectAlternative,
  toggleTradeoffs,
}) {
  const addToast = useToastStore((state) => state.addToast);

  const handleRejectAlternative = (colIndex) => {
    rejectAlternative(colIndex);

    addToast(
      "Alternatywa została odrzucona i ukryta. Możesz ją zawsze przywrócić.",
      "warning",
    );
  };

  const handleRestoreAlternative = (colIndex) => {
    restoreAlternative(colIndex);

    addToast("Alternatywa została przywrócona.", "success");
  };

  const shouldRender =
    showRanking &&
    (Object.keys(dominationResults).length > 0 ||
      winnerIndex !== null ||
      rejectedAlternatives.length > 0 ||
      completeAlts.length < alternatives.length ||
      completeAlts.length ===
        alternatives
          .map((_, i) => i)
          .filter((i) => !rejectedAlternatives.includes(i)).length);

  if (!shouldRender) return null;

  const activeAltsCount = alternatives.filter(
    (_, i) => !rejectedAlternatives.includes(i),
  ).length;
  const isStuckInTradeoffPhase =
    completeAlts.length === activeAltsCount &&
    winnerIndex === null &&
    Object.keys(dominationResults).length === 0 &&
    activeAltsCount > 1;

  const visibleColsCount = showRejected
    ? alternatives.length
    : alternatives.length - rejectedAlternatives.length;

  return (
    <tr>
      <td className="sticky left-0 z-[50] bg-card/90 backdrop-blur-md text-right text-foreground font-semibold pr-5 whitespace-nowrap border-b border-r border-border py-4 shadow-[inset_-1px_0_0_var(--border)] rounded-bl-xl overflow-visible">
        <div className="flex items-center justify-end gap-2 text-sm tracking-wider">
          <span>Analiza SMART</span>

          <div className="relative group cursor-help">
            <Info className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-[320px] p-4 bg-card border border-border shadow-2xl rounded-xl z-[60] normal-case tracking-normal font-normal text-left text-foreground pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="space-y-3 whitespace-normal normal-case tracking-normal font-normal leading-snug">
                <div>
                  <strong className="text-destructive flex items-center gap-1.5 mb-1 text-[13px] font-semibold">
                    <XCircle className="w-4 h-4 shrink-0" />
                    Dominacja ścisła
                  </strong>
                  <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                    Istnieje inna opcja, która jest lepsza lub równa we
                    wszystkich kryteriach. Tę alternatywę możesz bezpiecznie
                    odrzucić.
                  </p>
                </div>

                <div>
                  <strong className="text-amber-500 dark:text-amber-400 flex items-center gap-1.5 mb-1 text-[13px] font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Dominacja praktyczna
                  </strong>
                  <p className="text-xs text-muted-foreground m-0 leading-relaxed">
                    Istnieje opcja lepsza w niemal wszystkim. Oceniana
                    alternatywa zachowuje przewagę tylko w jednym kryterium (o
                    max. 1 pozycję). Rozważ jej odrzucenie dla uproszczenia.
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover border-b border-r border-border rotate-45 z-[59]"></div>
            </div>
          </div>
        </div>
      </td>

      {isStuckInTradeoffPhase ? (
        // Restore cells stay outside the tradeoff colSpan so rejected alternatives remain accessible.
        <>
          <td
            colSpan={showRejected ? activeAltsCount : visibleColsCount}
            className="p-4 align-middle border-b border-border text-center rounded-br-xl"
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Brak jednoznacznego zwycięzcy.
              </span>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Kontynuuj w trybie kompromisów, aby zacząć wyrównywać kryteria.
              </p>
              <Button
                variant="purple"
                size="sm"
                className="mt-2"
                onClick={toggleTradeoffs}
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Uruchom Kompromisy
              </Button>
            </div>
          </td>

          {showRejected &&
            alternatives.map((_, colIndex) => {
              if (rejectedAlternatives.includes(colIndex)) {
                return (
                  <td
                    key={`dom-reject-${colIndex}`}
                    className="p-1.5 align-middle border-b border-r border-border text-center bg-muted/30 opacity-40"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreAlternative(colIndex)}
                      className="rounded-full text-xs"
                    >
                      Przywróć opcję
                    </Button>
                  </td>
                );
              }
              return null;
            })}
        </>
      ) : (
        alternatives.map((_, colIndex) => {
          const isRejected = rejectedAlternatives.includes(colIndex);
          const isWinner = winnerIndex === colIndex;
          const isComplete = completeAlts.includes(colIndex);
          const dom = dominationResults[colIndex];
          const isLastCell = colIndex === alternatives.length - 1;

          const isEmptyAlt = !objectives.some((_, rowIndex) => {
            const val = cells[`${rowIndex}-${colIndex}`];
            return (
              val !== undefined && val !== null && val.toString().trim() !== ""
            );
          });

          if (isRejected) {
            return (
              <td
                key={`dom-${colIndex}`}
                className={`p-1.5 align-middle border-b border-r border-border text-center bg-muted/30 ${!showRejected ? "hidden" : "opacity-40"} ${isLastCell ? "rounded-br-xl" : ""}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreAlternative(colIndex)}
                  className="rounded-full text-xs"
                >
                  Przywróć opcję
                </Button>
              </td>
            );
          }

          if (!isComplete) {
            return (
              <td
                key={`dom-${colIndex}`}
                className={`p-3 align-middle border-b border-r border-border text-center bg-muted/20 text-[11px] text-muted-foreground ${isLastCell ? "rounded-br-xl" : ""}`}
              >
                {!isEmptyAlt && (
                  <div className="flex flex-col items-center gap-1.5">
                    <Badge variant="default">NIEKOMPLETNA</Badge>
                    <span>Wypełnij pola.</span>
                  </div>
                )}
              </td>
            );
          }

          if (isWinner) {
            return (
              <td
                key={`dom-${colIndex}`}
                className={`p-2 align-middle border-b border-r border-border bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-500 text-[12px]  text-center ${isLastCell ? "rounded-br-xl" : ""}`}
              >
                <div className="flex flex-col items-center justify-center mb-1.5 mt-1">
                  <Badge variant="success" className="px-3 py-1">
                    <Trophy className="w-4 h-4 mr-1.5" />
                    ZWYCIĘZCA
                  </Badge>
                </div>
                <span className="block opacity-90">Optymalna decyzja.</span>
              </td>
            );
          }

          if (!dom)
            return (
              <td
                key={`dom-${colIndex}`}
                className={`p-3 align-middle border-b border-r border-border bg-card text-center ${isLastCell ? "rounded-br-xl" : ""}`}
              ></td>
            );

          if (dom.type === DOMINATION_TYPES.STRICT) {
            return (
              <td
                key={`dom-${colIndex}`}
                className={`p-3 align-middle border-b border-r border-border bg-red-50 dark:bg-red-950/30 text-[12px] text-center ${isLastCell ? "rounded-br-xl" : ""}`}
              >
                <Badge variant="danger" className="mb-2">
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Zdominowana
                </Badge>
                <span className="block mb-2.5 text-red-600/80 dark:text-red-400/80">
                  Przegrała z <b>"{dom.by}"</b>.
                </span>
                <Button
                  variant="destructiveOutline"
                  size="sm"
                  className="text-[14px] "
                  onClick={() => handleRejectAlternative(colIndex)}
                >
                  Odrzuć
                </Button>
              </td>
            );
          } else {
            return (
              <td
                key={`dom-${colIndex}`}
                className={`p-3 align-middle border-b border-r border-border bg-amber-50 dark:bg-amber-950/30 text-[12px] text-center ${isLastCell ? "rounded-br-xl" : ""}`}
              >
                <Badge variant="warning" className="mb-2">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Słabo zdominowana
                </Badge>
                <span className="block mb-2.5 text-amber-600/80 dark:text-amber-500/80">
                  Lepsza od <b>"{dom.by}"</b> tylko w: <b>"{dom.objective}"</b>.
                </span>

                <Button
                  variant="amberOutline"
                  size="sm"
                  className="text-[14px]"
                  onClick={() => handleRejectAlternative(colIndex)}
                >
                  Rozważ odrzucenie
                </Button>
              </td>
            );
          }
        })
      )}
    </tr>
  );
}
