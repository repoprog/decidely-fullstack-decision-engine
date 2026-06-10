import React from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { TablePagination } from "../../../components/ui/TablePagination";

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="p-4 w-[25%]">
      <div className="h-4 bg-muted rounded w-3/4"></div>
    </td>
    <td className="p-4 w-[25%]">
      <div className="h-4 bg-muted rounded w-full"></div>
    </td>
    <td className="p-4 w-[20%]">
      <div className="h-4 bg-muted rounded w-20"></div>
    </td>
    <td className="p-4 w-[20%]">
      <div className="h-4 bg-muted rounded w-24"></div>
    </td>
    <td className="p-4 w-[10%]">
      <div className="h-8 bg-muted rounded w-10 ml-auto"></div>
    </td>
  </tr>
);

export function AdminSharesTable({
  shares,
  isLoading,
  onRevoke,
  currentPage,
  totalPages,
  onPageChange,
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Aktywne Udostępnienia</h2>
      </div>
      <Card noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium w-[25%]">Projekt</th>
                <th className="px-4 py-3 font-medium w-[25%]">Właściciel</th>
                <th className="px-4 py-3 font-medium w-[20%]">Token</th>
                <th className="px-4 py-3 font-medium w-[20%]">Wygasa</th>
                <th className="px-4 py-3 font-medium w-[10%] text-right">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : shares.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Brak aktywnych linków udostępniających.
                  </td>
                </tr>
              ) : (
                shares.map((share) => (
                  <tr
                    key={share.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td
                      className="px-4 py-3 font-medium truncate"
                      title={share.projectTitle}
                    >
                      {share.projectTitle}
                    </td>
                    <td
                      className="px-4 py-3 truncate"
                      title={share.sharedByEmail}
                    >
                      {share.sharedByEmail}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs truncate">
                      {share.maskedToken}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground truncate">
                      {share.expiresAt
                        ? new Date(share.expiresAt).toLocaleString("pl-PL")
                        : "Nigdy"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghostDestructive"
                        size="sm"
                        onClick={() => onRevoke(share.id)}
                        title="Usuń link"
                        className="ml-auto shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      </Card>
    </section>
  );
}
