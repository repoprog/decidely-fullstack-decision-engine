import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getStraightPath } from "@xyflow/react";
import { useTreeStore } from "../../store/useTreeStore.js";
import { FloatingToolbar } from "../../../../components/ui/FloatingToolbar.jsx";
import { useClipboardActions } from "../../../../hooks/useClipboardActions.js";
import { parseProbabilityString } from "../../logic/treeAlgorithms";
import { EyeOff } from "lucide-react";

export function SmartChoicesEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}) {
  const updateEdgeData = useTreeStore((s) => s.updateEdgeData);
  const setEdgeProbability = useTreeStore((s) => s.setEdgeProbability);
  const toggleEdgeAutoBalance = useTreeStore((s) => s.toggleEdgeAutoBalance);

  const siblingCount = data?.injectedSiblingCount ?? 1;
  const sourceNodeType = data?.injectedSourceType;
  const isSharedView = data?.injectedIsSharedView ?? false;

  const canInteract = !isSharedView;

  const pointerEventsClass = canInteract
    ? "pointer-events-auto"
    : "pointer-events-none";

  const [isInteracting, setIsInteracting] = useState(false);
  const [localOpt, setLocalOpt] = useState(null);
  const [localCost, setLocalCost] = useState(null);

  const opt = data?.optionLabel ?? "";
  const cost = data?.cost ?? "";
  const displayProb = parseProbabilityString(data?.probability);

  const displayOpt = localOpt !== null ? localOpt : opt;
  const displayCost = localCost !== null ? localCost : cost;

  const handleProbChange = (e) => {
    if (!canInteract) return;
    const newProb = parseFloat(e.target.value);
    if (!isNaN(newProb)) setEdgeProbability(id, newProb);
  };

  const stepProbability = (step) => {
    if (!canInteract) return;
    const next = Math.max(
      0,
      Math.min(100, (isNaN(displayProb) ? 0 : displayProb) + step),
    );
    setEdgeProbability(id, next);
  };

  const handleInteractionStart = (e) => {
    if (!canInteract) return;
    e.stopPropagation();
    useTreeStore.temporal.getState().pause();
  };

  const handleInteractionEnd = (e) => {
    if (!canInteract) return;
    e.stopPropagation();
    useTreeStore.temporal.getState().resume();
    useTreeStore.setState((s) => ({ ...s }));
  };

  const globalShowCost = data?.showCost ?? false;
  const isHighlighted = data?.isHighlighted;
  const hasCostValue = cost !== "" && cost != null;

  const renderCostArea = globalShowCost || hasCostValue;

  // Keep the cost draft visible until blur so partially typed values are not overwritten.
  const showFullInput = globalShowCost || isInteracting || localCost !== null;

  const rawCost = String(cost);
  const numericCost = parseFloat(
    rawCost
      .replace(/zł|%|\s/g, "")
      .replace(",", ".")
      .replace("−", "-"),
  );

  let costColorClass = "text-slate-700 dark:text-slate-200"; 
  if (numericCost > 0)
    costColorClass = "text-emerald-600 dark:text-emerald-400";
  else if (numericCost < 0) costColorClass = "text-red-600 dark:text-red-400";

  const baseInputClassName =
    "block w-[min(8rem,20vw)] max-w-[150px] rounded border border-transparent bg-transparent px-1.5 py-0.5 text-left font-sans text-[12px] font-medium leading-tight outline-none placeholder:text-muted-foreground/50 hover:border-slate-600 focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors";
  const { executeCopy, executePaste, executeDelete } = useClipboardActions(
    id,
    true,
  );

  let path, labelX_Start, labelX_Center, labelY;

  if (siblingCount <= 1) {
    [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    labelX_Start = sourceX;
    labelX_Center = (sourceX + targetX) / 2;
    labelY = (sourceY + targetY) / 2;
  } else {
    const H_OFFSET = 20;
    path = `M ${sourceX} ${sourceY} L ${sourceX + H_OFFSET} ${targetY} L ${targetX} ${targetY}`;
    labelX_Start = sourceX + H_OFFSET;
    labelX_Center = (sourceX + H_OFFSET + targetX) / 2;
    labelY = targetY;
  }

  const edgeStyle = {
    ...style,
    stroke: isHighlighted ? "#10b981" : "#06b6d4",
    strokeWidth: isHighlighted ? 2.5 : 1.15,
  };

  return (
    <>
      <BaseEdge id={id} path={path} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          className={`nodrag nopan ${pointerEventsClass}`}
          style={{
            position: "absolute",
            transform: `translate(0, -100%) translate(${labelX_Start}px, ${labelY - 8}px)`,
            textAlign: "left",
            zIndex: 30,
          }}
        >
          <div className="relative flex items-center group/opt">
            <input
              className={`${baseInputClassName} text-sky-700 ${!opt ? "hide-on-export" : ""} ${isHighlighted ? "border-emerald-400/60 !text-emerald-700" : ""}`}
              value={displayOpt}
              onChange={(e) => {
                if (canInteract) setLocalOpt(e.target.value);
              }}
              onBlur={() => {
                if (canInteract && localOpt !== null) {
                  updateEdgeData(id, { optionLabel: localOpt });
                  setLocalOpt(null);
                }
              }}
              onPointerDown={(e) => {
                if (canInteract) e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (!canInteract) return;
                e.stopPropagation();
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              placeholder="Opcja"
              readOnly={!canInteract}
              tabIndex={canInteract ? 0 : -1}
            />
            {canInteract && (
              <div className="opacity-0 group-hover/opt:opacity-100 transition-opacity hide-on-export">
                <FloatingToolbar
                  positionClass="bottom-full pb-1"
                  title="opcję"
                  onCopy={(e) => executeCopy(e, opt)}
                  onPaste={(e) => executePaste(e, "optionLabel")}
                  onDelete={(e) => executeDelete(e, "optionLabel")}
                />
              </div>
            )}
          </div>
        </div>

        {renderCostArea && (
          <div
            className={`nodrag nopan ${pointerEventsClass}`}
            style={{
              position: "absolute",
              transform: `translate(0, 0%) translate(${labelX_Start}px, ${labelY + 8}px)`,
              textAlign: "left",
              zIndex: 30,
            }}
            onMouseEnter={() => {
              if (canInteract) setIsInteracting(true);
            }}
            onMouseLeave={() => {
              if (canInteract) setIsInteracting(false);
            }}
            onFocus={() => {
              if (canInteract) setIsInteracting(true);
            }}
            onBlur={(e) => {
              if (canInteract && !e.currentTarget.contains(e.relatedTarget))
                setIsInteracting(false);
            }}
          >
            {showFullInput || !canInteract ? (
              <div className="relative flex items-center group/cost">
                <input
                  className={`${baseInputClassName} ${costColorClass} ${!cost ? "hide-on-export" : ""}`}
                  value={displayCost}
                  onChange={(e) => {
                    if (canInteract) setLocalCost(e.target.value);
                  }}
                  onBlur={() => {
                    if (canInteract && localCost !== null) {
                      updateEdgeData(id, { cost: localCost });
                      setLocalCost(null);
                    }
                  }}
                  onPointerDown={(e) => {
                    if (canInteract) e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (!canInteract) return;
                    e.stopPropagation();
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  placeholder="np. -1000"
                  autoFocus={!globalShowCost && canInteract}
                  readOnly={!canInteract}
                  tabIndex={canInteract ? 0 : -1}
                />
                {canInteract && (
                  <div className="opacity-0 group-hover/cost:opacity-100 transition-opacity hide-on-export">
                    <FloatingToolbar
                      positionClass="top-full pt-1"
                      title="koszt"
                      onCopy={(e) => executeCopy(e, cost)}
                      onPaste={(e) => executePaste(e, "cost")}
                      onDelete={(e) =>
                        executeDelete(e, "cost", () => setIsInteracting(false))
                      }
                    />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
                title="Podejrzyj ukryty koszt"
                className="flex items-center justify-center w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm border border-border/50  text-cyan-600 hover:text-cyan-500 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all hide-on-export"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {sourceNodeType === "chance" && (
          <div
            className={`nodrag nopan ${pointerEventsClass}`}
            style={{
              position: "absolute",
              transform: `translate(-50%, 0) translate(${labelX_Center}px, ${labelY + 2}px)`,
              textAlign: "center",
              zIndex: 40,
            }}
          >
            <div
              className={`relative group/prob ${isHighlighted ? "highlighted" : ""}`}
            >
              <div className="flex items-center rounded border border-transparent bg-transparent px-1 py-0.5 hover:border-cyan-400 transition-colors">
                <input
                  type="number"
                  value={isNaN(displayProb) ? "" : displayProb}
                  onChange={handleProbChange}
                  onFocus={handleInteractionStart}
                  onBlur={handleInteractionEnd}
                  onKeyDown={(e) => {
                    if (!canInteract) return;
                    e.stopPropagation();
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onPointerDown={(e) => {
                    if (canInteract) e.stopPropagation();
                  }}
                  className="w-9 bg-transparent text-right text-xs font-medium text-orange-400 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hide-on-export-img"
                  readOnly={!canInteract}
                  tabIndex={canInteract ? 0 : -1}
                />

                <div className="hidden show-on-export-img w-9 text-right text-xs font-medium text-orange-400">
                  {isNaN(displayProb) ? "" : displayProb}
                </div>

                <span className="text-xs text-slate-400 ml-0.5">%</span>

                {canInteract && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEdgeAutoBalance(id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`flex h-4 w-4 hide-on-export items-center justify-center rounded transition-colors ${
                      data?.isLocked
                        ? " text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                        : " text-cyan-400 hover:bg-cyan-500/40"
                    }`}
                    title={
                      data?.isLocked
                        ? "Autorebalance WYŁĄCZONY (kliknij, aby włączyć)"
                        : "Autorebalance WŁĄCZONY (zablokuj wpisując wartość)"
                    }
                  >
                    {data?.isLocked ? (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="11"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    ) : (
                      <span className="text-[9px] font-bold">A</span>
                    )}
                  </button>
                )}
              </div>

              {canInteract && (
                <div className="absolute top-full left-1/2 pt-0.5 w-40 -translate-x-1/2 z-50 hidden group-hover/prob:block focus-within:block hide-on-export">
                  <div className="flex items-center justify-between gap-1.5 rounded-md border border-cyan-500/60 bg-white/90 p-1.5 shadow-lg backdrop-blur-sm dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stepProbability(-1);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-lg font-medium leading-none text-cyan-600 hover:bg-slate-200 hover:text-cyan-700 focus:outline-none dark:bg-slate-800 dark:text-cyan-400 dark:hover:bg-slate-700 dark:hover:text-cyan-300"
                    >
                      -
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={isNaN(displayProb) ? "0" : displayProb}
                      onChange={handleProbChange}
                      onPointerDown={handleInteractionStart}
                      onPointerUp={handleInteractionEnd}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-cyan-500 dark:bg-slate-700 dark:accent-cyan-500"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stepProbability(1);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-lg font-medium leading-none text-cyan-600 hover:bg-slate-200 hover:text-cyan-700 focus:outline-none dark:bg-slate-800 dark:text-cyan-400 dark:hover:bg-slate-700 dark:hover:text-cyan-300"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
