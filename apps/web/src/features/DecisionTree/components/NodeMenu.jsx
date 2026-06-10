import { useTreeStore } from "../store/useTreeStore.js";
import {
  Circle,
  Square,
  Triangle,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { NODE_TYPES } from "../../../constants/decisionTypes";

export function NodeMenu({ nodeId, nodeType, hasIncoming }) {
  const addBranch = useTreeStore((s) => s.addBranch);
  const removeNode = useTreeStore((s) => s.removeNode);
  const swapNodeType = useTreeStore((s) => s.swapNodeType);
  const toggleEdgesCost = useTreeStore((s) => s.toggleEdgesCost);
  const edges = useTreeStore((s) => s.edges);
  const outgoingEdges = edges.filter((e) => e.source === nodeId);
  const areCostsVisible = outgoingEdges.some((e) => e.data?.showCost === true);
  const isTerminal = nodeType === NODE_TYPES.TERMINAL;

  const btnClass =
    "flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-sans text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";
  const iconClass = "w-[15px] h-[15px] shrink-0";
  const dividerClass = "mx-2 my-0.5 h-px bg-border";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xl w-48 py-1 z-50 relative">
      {!isTerminal && (
        <>
          <button
            className={btnClass}
            onClick={() => addBranch(nodeId, NODE_TYPES.CHANCE)}
          >
            <Circle className={iconClass} />
            Dodaj niepewność
          </button>

          <button
            className={btnClass}
            onClick={() => addBranch(nodeId, NODE_TYPES.DECISION)}
          >
            <Square className={iconClass} />
            Dodaj decyzję
          </button>

          <button
            className={btnClass}
            onClick={() => addBranch(nodeId, NODE_TYPES.TERMINAL)}
          >
            <Triangle className={`${iconClass} rotate-90`} />
            Dodaj konsekwencję
          </button>

          <div className={dividerClass} />
        </>
      )}

      {nodeType !== NODE_TYPES.CHANCE && (
        <button
          className={btnClass}
          onClick={() => swapNodeType(nodeId, NODE_TYPES.CHANCE)}
        >
          <ArrowRightLeft className={iconClass} />
          Zamień na niepewność
        </button>
      )}

      {nodeType !== NODE_TYPES.DECISION && (
        <button
          className={btnClass}
          onClick={() => swapNodeType(nodeId, NODE_TYPES.DECISION)}
        >
          <ArrowRightLeft className={iconClass} />
          Zamień na decyzję
        </button>
      )}

      {nodeType !== NODE_TYPES.TERMINAL && (
        <button
          className={btnClass}
          onClick={() => swapNodeType(nodeId, NODE_TYPES.TERMINAL)}
        >
          <ArrowRightLeft className={iconClass} />
          Zamień na konsekwencję
        </button>
      )}

      {!isTerminal && (
        <>
          <div className={dividerClass} />
          <button
            className={`${btnClass} !text-emerald-600 dark:!text-emerald-400 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/30`}
            onClick={() => toggleEdgesCost(nodeId)}
          >
            {areCostsVisible ? (
              <EyeOff className={iconClass} />
            ) : (
              <Eye className={iconClass} />
            )}
            {areCostsVisible ? "Ukryj koszty / zysk" : "Pokaż koszty / zysk"}
          </button>
        </>
      )}

      {hasIncoming && (
        <>
          <div className={dividerClass} />
          <button
            className={`${btnClass} !text-destructive hover:!bg-destructive/10`}
            onClick={() => removeNode(nodeId)}
          >
            <Trash2 className={iconClass} />
            Usuń {isTerminal ? "wynik" : "gałąź"}
          </button>
        </>
      )}
    </div>
  );
}
