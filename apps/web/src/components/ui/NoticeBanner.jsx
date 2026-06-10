import React from "react";
import { AlertCircle, X, RefreshCw } from "lucide-react";

const VARIANT_STYLES = {
  warning: {
    container: "bg-amber-500/10 border-amber-500/30",
    iconBox: "bg-amber-500/20",
    icon: "text-amber-600 dark:text-amber-500",
    title: "text-amber-800 dark:text-amber-400",
    text: "text-amber-800/90 dark:text-amber-400/90",
    bullet: "text-amber-600 dark:text-amber-500",
    button:
      "bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-400",
    closeHover: "hover:bg-amber-500/10",
  },
  error: {
    container: "bg-destructive/10 border-destructive/30",
    iconBox: "bg-destructive/15",
    icon: "text-destructive",
    title: "text-destructive",
    text: "text-destructive/90",
    bullet: "text-destructive",
    button: "bg-destructive/15 hover:bg-destructive/25 text-destructive",
    closeHover: "hover:bg-destructive/10",
  },
};

export function NoticeBanner({
  items,
  title,
  helperText,
  onDismiss,
  onAction,
  actionLabel = "Spróbuj ponownie",
  variant = "warning",
}) {
  if (!items || items.length === 0) return null;

  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.warning;

  return (
    <div
      className={`${styles.container} border rounded-lg p-4 animate-in slide-in-from-top duration-300`}
    >
      <div className="flex items-start gap-3">
        <div className={`${styles.iconBox} p-1.5 rounded-lg flex-shrink-0`}>
          <AlertCircle className={`w-5 h-5 ${styles.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-medium ${styles.title}`}>{title}</h4>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`p-1 ${styles.closeHover} rounded transition-colors`}
                title="Zamknij"
                type="button"
              >
                <X className={`w-4 h-4 ${styles.icon}`} />
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="flex items-start gap-2 text-sm"
              >
                <span className={`${styles.bullet} mt-0.5`}>•</span>
                <div className="flex-1">
                  <span className={styles.text}>{item}</span>
                </div>
              </li>
            ))}
          </ul>

          {helperText && (
            <p className={`mt-3 text-xs ${styles.text}`}>{helperText}</p>
          )}

          {onAction && (
            <button
              onClick={onAction}
              className={`flex items-center gap-2 mt-3 px-3 py-1.5 ${styles.button} rounded-lg text-sm transition-colors`}
              type="button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
