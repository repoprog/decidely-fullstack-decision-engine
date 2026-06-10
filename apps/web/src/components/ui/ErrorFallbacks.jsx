import React from "react";

import { Card } from "./Card";
import { Button } from "./Button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function TreeErrorFallback({ resetErrorBoundary }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
      <div className="text-center flex flex-col items-center max-w-sm">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-foreground">
          Błąd wizualizacji drzewa
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Silnik graficzny napotkał nieoczekiwany błąd. Twoje dane są
          bezpieczne, problem dotyczy tylko wyświetlania. Spróbuj zresetować sam
          silnik drzewa.
        </p>

        <Button onClick={resetErrorBoundary} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Resetuj silnik drzewa
        </Button>
      </div>
    </div>
  );
}

export function TableErrorFallback({ resetErrorBoundary }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
      <div className="text-center flex flex-col items-center max-w-sm">
        <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h3 className="text-lg font-bold mb-2 text-foreground">
          Błąd obliczeń tabeli
        </h3>
        <p className="text-muted-foreground text-sm mb-6">
          Wystąpił błąd podczas przetwarzania danych tabeli. Sprawdź, czy
          wpisane wartości są poprawne lub spróbuj przeliczyć tabelę ponownie.
        </p>

        <Button onClick={resetErrorBoundary} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Przelicz tabelę ponownie
        </Button>
      </div>
    </div>
  );
}
