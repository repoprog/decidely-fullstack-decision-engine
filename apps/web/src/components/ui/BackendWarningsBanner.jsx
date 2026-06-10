import React from "react";
import { NoticeBanner } from "./NoticeBanner";

export function BackendWarningsBanner({ warnings, onDismiss, onRetry }) {
  const count = warnings?.length ?? 0;

  return (
    <NoticeBanner
      items={warnings}
      title={`Wykryto ${count} ${count === 1 ? "uwagę" : count < 5 ? "uwagi" : "uwag"} z serwera`}
      onDismiss={onDismiss}
      onAction={onRetry}
      actionLabel="Spróbuj ponownie"
      variant="warning"
    />
  );
}
