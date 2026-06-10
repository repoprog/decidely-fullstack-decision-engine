export function FloatingToolbar({
  positionClass,
  title,
  onCopy,
  onPaste,
  onDelete,
}) {
  return (
    <div
      className={`absolute right-0 flex items-center gap-1 ${positionClass}`}
    >
      <button
        onClick={onCopy}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Kopiuj ${title}`}
        className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>

      <button
        onClick={onPaste}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Wklej ${title}`}
        className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      </button>

      <button
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        title={`Usuń ${title}`}
        className="pointer-events-auto flex h-5 w-5 items-center justify-center rounded border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}
