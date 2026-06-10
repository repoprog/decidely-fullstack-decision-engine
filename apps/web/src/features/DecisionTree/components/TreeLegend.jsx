import { Panel } from "@xyflow/react";
import { Square, Circle, Triangle } from "lucide-react";

export function TreeLegend() {
  return (
    <Panel
      position="bottom-left"
      className="pointer-events-none m-4 mb-[4.5rem] "
    >
      <div className="export-force-light-legend ml-16 flex items-center gap-4 rounded border border-border bg-card/95 px-3 py-2 font-sans text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm transition-colors leading-none">
        <span className="flex items-center gap-1.5">
          <Square className="w-3 h-3 text-foreground fill-card stroke-[2.5px]" />
          Decyzja
        </span>

        <span className="flex items-center gap-1.5">
          <Circle className="w-3 h-3 text-foreground fill-card stroke-[2.5px]" />
          Niepewność
        </span>

        <span className="flex items-center gap-1.5">
          <Triangle className="w-3 h-3 text-foreground fill-card stroke-[2.5px] rotate-90" />
          Konsekwencja
        </span>
      </div>
    </Panel>
  );
}
