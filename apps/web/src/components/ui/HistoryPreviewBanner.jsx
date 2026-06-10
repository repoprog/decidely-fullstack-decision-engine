import React from "react";
import { Clock, RotateCcw, X } from "lucide-react";

export function HistoryPreviewBanner({
  isVisible,
  itemTitle,
  itemDate,
  onRestore,
  onClose,
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-primary/10 backdrop-blur-md border-b-2 border-primary/30 px-6 py-3 animate-in slide-in-from-top duration-300 shadow-lg">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                Przeglądasz wersję historyczną
              </span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm font-medium text-primary">
                {itemTitle}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Zapisano:{" "}
              {itemDate
                ? new Date(itemDate).toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Brak daty"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRestore}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Przywróć tę wersję
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border text-foreground font-medium hover:bg-muted rounded-lg transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
            Wróć do aktualnej
          </button>
        </div>
      </div>
    </div>
  );
}
