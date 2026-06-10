import React from "react";
import { Handle, Position } from "@xyflow/react";
import { useTreeStore } from "../../store/useTreeStore.js";
import { NodeMenu } from "../NodeMenu.jsx";
import { NodeEquationBadge } from "./NodeEquationBadge.jsx";

const handleClass =
  "!h-2 !w-2 !min-h-0 !min-w-0 !border !border-slate-900 !bg-white !opacity-80";

export function DecisionNode({ id, data }) {
  const edges = useTreeStore((state) => state.edges);
  const isSimulationMode = data?.isSimulationActive;
  const hasIncoming = edges.some((edge) => edge.target === id);
  const isHighlighted = data?.isHighlighted;
  const hasExpectedValue = typeof data?.expectedValue === "number";

  const nodeClasses = `flex h-11 w-11 items-center justify-center rounded-sm border shadow-sm transition-colors ${
    isHighlighted
      ? "border-emerald-500 bg-emerald-50 font-bold ring-4 ring-emerald-500/30"
      : "border-slate-900 bg-white"
  }`;

  const spanClasses = `font-sans text-sm font-semibold tabular-nums ${
    isHighlighted ? "text-emerald-800" : "text-slate-900"
  }`;

  const expectedValueBadgeClass = isHighlighted
    ? "bg-emerald-50 border-emerald-400 shadow-sm dark:bg-emerald-950/80 dark:border-emerald-800 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    : "bg-white border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.07),inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

  const expectedValueTextClass = isHighlighted
    ? "text-emerald-700 dark:text-emerald-300"
    : "text-amber-700 dark:text-yellow-400 dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]";

  return (
    <div className="relative z-10 hover:!z-[9999]">
      <div className="group/node relative h-11 w-11">
        <div className={nodeClasses}>
          <span className={spanClasses}>{data.nodeNumber}</span>
          <Handle
            type="target"
            position={Position.Left}
            className={handleClass}
          />
          <Handle
            type="source"
            position={Position.Right}
            className={handleClass}
          />
        </div>

        <div className="absolute left-full top-1/2 pl-1 flex -translate-y-1/2 flex-col opacity-0 group-hover/node:pointer-events-auto group-hover/node:opacity-100 pointer-events-none z-[1000]">
          <NodeMenu nodeId={id} nodeType="decision" hasIncoming={hasIncoming} />
        </div>
      </div>

      {hasExpectedValue && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex justify-center">
          <div className="relative flex items-center justify-center gap-0.5">
            <NodeEquationBadge
              equation={data.equation}
              symbol="ƒ"
              isSimulationActive={isSimulationMode}
            />

            <div
              className={`pointer-events-none rounded-md border px-3 py-0.5 backdrop-blur-sm transition-colors ${expectedValueBadgeClass}`}
            >
              <span
                className={`font-sans text-[13px] font-bold tracking-tight tabular-nums ${expectedValueTextClass}`}
              >
                {data.expectedValue.toLocaleString("pl-PL", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
