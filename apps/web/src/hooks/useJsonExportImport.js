import { useCallback, useRef } from "react";

const DEFAULT_EXPORT_ERROR =
  "Wystąpił błąd podczas generowania pliku do eksportu.";
const DEFAULT_IMPORT_ERROR =
  "Błąd odczytu. Upewnij się, że to poprawny plik .json.";

export function useJsonExportImport({
  buildExportData,
  onImport,
  filename,
  onError,
}) {
  const fileInputRef = useRef(null);

  const reportError = useCallback(
    (message) => {
      onError?.(message);
    },
    [onError],
  );

  const handleExport = useCallback(() => {
    let url = null;
    let link = null;

    try {
      const data = buildExportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      url = URL.createObjectURL(blob);
      link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
    } catch {
      reportError(DEFAULT_EXPORT_ERROR);
    } finally {
      if (link?.parentNode) {
        link.parentNode.removeChild(link);
      }

      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  }, [buildExportData, filename, reportError]);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (loadEvent) => {
        try {
          const result = loadEvent.target?.result;

          if (typeof result !== "string") {
            reportError(DEFAULT_IMPORT_ERROR);
            return;
          }

          const parsed = JSON.parse(result);
          onImport(parsed);
        } catch {
          reportError(DEFAULT_IMPORT_ERROR);
        }
      };

      reader.onerror = () => {
        reportError(DEFAULT_IMPORT_ERROR);
      };

      try {
      reader.readAsText(file);
      } catch {
        reportError(DEFAULT_IMPORT_ERROR);
      } finally {
      event.target.value = "";
      }
    },
    [onImport, reportError],
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    fileInputRef,
    handleExport,
    handleImportClick,
    handleFileChange,
  };
}
