import React from "react";

export function Badge({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center px-3 py-1 text-xs font-small transition-colors";

  const shapeStyle =
    variant === "table" || variant === "tree" ? "rounded-md" : "rounded-full";

  // Warianty zaktualizowane do kolorystyki z Figmy (opacity /20)
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-green-500/20 text-green-700",       // Zwycięzca
    warning: "bg-yellow-500/20 text-yellow-700",     // Słabo zdominowana
    danger: "bg-destructive/20 text-destructive",    // Zdominowana
    info: "bg-blue-500/20 text-blue-700",            // Niekompletna

    interactive:
      "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer border border-transparent",
    active:
      "bg-primary text-primary-foreground shadow-sm cursor-pointer border border-transparent",

    table:
      "bg-feature-table/10 text-feature-table border border-feature-table/20",
    tree: "bg-feature-tree/10 text-feature-tree border border-feature-tree/20",
  };

  const Component = onClick ? "button" : "span";

  return (
    <Component
      onClick={onClick}
      className={`${baseStyles} ${shapeStyle} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}