import React, { memo } from "react";
import { Button } from "./Button";

export const TablePagination = memo(function TablePagination({
  currentPage,
  totalPages,
  isLoading,
  onPageChange,
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0 || isLoading}
      >
        Poprzednia
      </Button>
      <span className="text-sm text-muted-foreground">
        Strona {currentPage + 1} z {totalPages || 1}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1 || isLoading}
      >
        Następna
      </Button>
    </div>
  );
});
