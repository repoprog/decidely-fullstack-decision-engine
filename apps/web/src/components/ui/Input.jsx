import React, { forwardRef, useId } from "react";

export const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      className = "",
      wrapperClassName = "",
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-2 text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
            w-full px-4 py-3 bg-muted/30 border rounded-lg text-sm outline-none transition-colors
            focus:ring-2 focus:ring-primary/20
            ${Icon ? "pl-10" : ""}
            ${
              error
                ? "border-destructive focus:border-destructive text-destructive"
                : "border-border focus:border-primary hover:border-primary/50 text-foreground"
            }
            ${className}
          `}
            {...props}
          />
        </div>

        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
