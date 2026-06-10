import React from "react";
import { NoticeBanner } from "./NoticeBanner";

export function SaveConflictBanner({
  currentProjectId,
  onRefreshFromCloud,
  onDismiss,
}) {
  if (!currentProjectId) return null;

  return (
    <NoticeBanner
      items={["Projekt został zmieniony w innej sesji."]}
      title="Konflikt wersji projektu"
      helperText="Odświeżenie zastąpi lokalne niezapisane zmiany najnowszą wersją z chmury. Aby zachować obecną decyzję, przed odświeżeniem wyeksportuj ją do pliku."
      onDismiss={onDismiss}
      onAction={onRefreshFromCloud}
      actionLabel="Odśwież z chmury"
      variant="error"
    />
  );
}
