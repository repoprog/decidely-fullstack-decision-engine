import { useState, useMemo } from "react";
import { ViewportPortal } from "@xyflow/react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useTreeStore } from "../store/useTreeStore.js";
import {
  computeStageHeaderRowY,
  getUniqueColumnXs,
} from "../logic/treeUtils.js";
import { Button } from "../../../components/ui/Button";
import { EVALUATION_MODES, NODE_TYPES } from "../../../constants/decisionTypes";

export function StageHeaders({
  readOnlyNodes,
  readOnlyEdges,
  readOnlyLabels,
  readOnlyEvalMode,
}) {
  const isReadOnly = !!readOnlyNodes;
  const storeNodes = useTreeStore((s) => s.nodes);
  const storeEdges = useTreeStore((s) => s.edges);
  const storeLabels = useTreeStore((s) => s.stageColumnLabels);
  const storeEvalMode = useTreeStore((s) => s.evaluationMode);

  const setStageColumnLabel = useTreeStore((s) => s.setStageColumnLabel);
  const setEvaluationMode = useTreeStore((s) => s.setEvaluationMode);

  const nodes = isReadOnly ? readOnlyNodes : storeNodes;
  const edges = isReadOnly ? readOnlyEdges : storeEdges;
  const labels = isReadOnly ? readOnlyLabels : storeLabels;
  const evaluationMode = isReadOnly ? readOnlyEvalMode : storeEvalMode;

  const [localLabels, setLocalLabels] = useState({});

  const rowY = useMemo(() => computeStageHeaderRowY(nodes), [nodes]);

  const columnXs = useMemo(() => {
    return getUniqueColumnXs(nodes, edges).map((x) => x + 22);
  }, [nodes, edges]);

  const hasTerminalNodes = useMemo(() => {
    return nodes.some(
      (n) => n.type === NODE_TYPES?.TERMINAL || n.type === "terminal",
    );
  }, [nodes]);

  if (!columnXs.length) return null;

  const headerWidth = 160;

  const handleToggleMode = () => {
    if (isReadOnly) return; // Zabezpieczenie przed przełączaniem w trybie publicznym
    setEvaluationMode(
      evaluationMode === EVALUATION_MODES.MAX
        ? EVALUATION_MODES.MIN
        : EVALUATION_MODES.MAX,
    );
  };

  return (
    <ViewportPortal>
      {columnXs.map((centerX, i) => {
        const text = labels[i] || "";
        const isLast = i === columnXs.length - 1;

        const isConsequencesColumn = isLast && hasTerminalNodes;

        const displayValue =
          localLabels[i] !== undefined ? localLabels[i] : text;

        return (
          <div
            key={i}
            className={`pointer-events-auto nodrag nopan ${isReadOnly ? "pointer-events-none" : ""}`}
            style={{
              position: "absolute",
              transform: `translate(${centerX - headerWidth / 2}px, ${rowY}px)`,
              width: `${headerWidth}px`,
              zIndex: -1,
            }}
            onPointerDown={(e) => !isReadOnly && e.stopPropagation()}
          >
            <div className="relative w-full">
              <input
                type="text"
                value={displayValue}
                onChange={(e) => {
                  if (isReadOnly) return;
                  setLocalLabels((prev) => ({ ...prev, [i]: e.target.value }));
                }}
                onBlur={() => {
                  if (isReadOnly) return;
                  if (localLabels[i] !== undefined) {
                    setStageColumnLabel(i, localLabels[i]);
                    setLocalLabels((prev) => {
                      const next = { ...prev };
                      delete next[i];
                      return next;
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder={
                  isConsequencesColumn ? "Konsekwencje" : `Etap ${i + 1}`
                }
                onPointerDown={(e) => !isReadOnly && e.stopPropagation()}
                readOnly={isReadOnly}
                className="box-border h-8 w-full rounded border backdrop-blur-sm border-slate-400 bg-transparent px-1.5 text-center text-[11px] font-semibold text-slate-800 shadow-sm outline-none backdrop-blur-sm placeholder:text-slate-400 focus-visible:border-slate-900 dark:border-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-slate-300"
              />

              {isLast && (
                <Button
                  variant="emeraldOutline"
                  onClick={handleToggleMode}
                  title={
                    evaluationMode === EVALUATION_MODES.MAX
                      ? "Zmień na poszukiwanie minimum (np. kosztów)"
                      : "Zmień na poszukiwanie maksimum (np. zysków)"
                  }
                  className="absolute -right-2 top-1/2 h-8 -translate-y-1/2 translate-x-full gap-1.5 whitespace-nowrap rounded px-3 text-[11px] font-semibold"
                  disabled={isReadOnly} // Zablokowanie klika w trybie readOnly
                >
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {evaluationMode === EVALUATION_MODES.MAX ? (
                      <ArrowUp className="w-4 h-4 stroke-[2.5px]" />
                    ) : (
                      <ArrowDown className="w-4 h-4 stroke-[2.5px]" />
                    )}
                  </span>
                  <span>
                    {evaluationMode === EVALUATION_MODES.MAX
                      ? "Lepiej [Max]"
                      : "Lepiej [Min]"}
                  </span>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </ViewportPortal>
  );
}
