import { useReactFlow, Panel } from "@xyflow/react";
import { ZoomIn, ZoomOut, Focus } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function CustomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-left" className="m-4 hide-on-export">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/90 p-1.5 shadow-sm backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomIn({ duration: 300 })}
          title="Przybliż"
          className="bg-muted/50"
        >
          <ZoomIn className="w-[18px] h-[18px]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => zoomOut({ duration: 300 })}
          title="Oddal"
          className="bg-muted/50"
        >
          <ZoomOut className="w-[18px] h-[18px]" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => fitView({ duration: 300 })}
          title="Dopasuj do ekranu"
          className="bg-muted/50"
        >
          <Focus className="w-[18px] h-[18px]" />
        </Button>
      </div>
    </Panel>
  );
}
