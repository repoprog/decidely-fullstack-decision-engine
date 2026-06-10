import React, { forwardRef } from "react";

export const Button = forwardRef(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

    const variants = {
      default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      
      // NOWY: Wariant dla przycisku "Odrzuć" (styl z Figmy)
      destructiveOutline:
        "bg-destructive/10 text-destructive hover:bg-destructive/20",

      outline:
        "border border-border bg-card hover:bg-muted hover:text-foreground text-muted-foreground",
      secondary: "bg-muted text-foreground hover:bg-muted/80",
      ghost: "hover:bg-muted hover:text-foreground text-muted-foreground",
      dangerGhost:
        "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
      ghostDestructive:
        "bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
      dangerActive:
        "border border-destructive/70 bg-destructive/10 text-destructive hover:bg-transparent hover:border-destructive/40 hover:text-destructive/80",

      purple: "bg-purple-500 text-white hover:bg-purple-600",
      cyan: "bg-cyan-500  text-white  hover:bg-cyan-600 hover:text-white",
      amber: "bg-amber-500 text-white hover:bg-amber-600",
      
     
      amberOutline:
        "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20 ",

      defaultPurple:
        "bg-primary text-primary-foreground  hover:bg-purple-500 hover:text-white",
      defaultAmber:
        "bg-primary text-primary-foreground hover:bg-amber-500 hover:text-white",
      defaultCyan:
        "bg-primary text-primary-foreground  hover:bg-cyan-600 hover:text-white",

      emeraldOutline:
        "border border-emerald-400/80 bg-emerald-50 text-emerald-800  backdrop-blur-sm hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-700/80 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-900",
    };

    const sizes = {
      default: "h-9 px-4 py-2 text-sm rounded-lg",
      sm: "h-8 px-3 text-xs rounded-lg",
      lg: "h-10 px-8 text-base rounded-lg",
      icon: "h-9 w-9 rounded-lg",
      iconSm: "h-7 w-7 text-lg rounded-lg",

      circle: "h-9 w-9 rounded-full p-0",
      circleSm: "h-7 w-7 rounded-full p-0",
    };

    const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button ref={ref} className={combinedClasses} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";