import React, { useState, useEffect } from "react";

export function NodeEquationBadge({
  equation,
  symbol = "∑",
  isSimulationActive = false,
}) {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    setIsPinned(isSimulationActive);
  }, [isSimulationActive]);

  if (!equation) return null;

  return (
    <div className="absolute right-full mr-1.5 flex items-center group/eq">
      <div
        className="nodrag nopan relative z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsPinned((current) => !current);
        }}
      >
        <div
          className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
            isPinned
              ? "bg-sky-500 text-white shadow-md"
              : "bg-slate-200/80 text-slate-600 group-hover/eq:bg-slate-300"
          }`}
        >
          {symbol}
        </div>
      </div>

      <div
        className={`pointer-events-none absolute top-full left-1/2 z-[10000] hover:z-[10001] mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-300 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-xl transition-all duration-200 ${
          isPinned
            ? "opacity-100 -translate-y-0.5"
            : "opacity-0 translate-y-0 group-hover/eq:opacity-100 group-hover/eq:-translate-y-0.5"
        }`}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-300"></div>
        <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"></div>
        {equation}
      </div>
    </div>
  );
}
