import React from "react";

export function Card({ children, className = "", noPadding = false }) {
  return (
    <div
      className={`bg-card border border-border rounded-xl shadow-sm ${noPadding ? "" : "p-5 md:p-6"} ${className}`}
    >
      {children}
    </div>
  );
}
