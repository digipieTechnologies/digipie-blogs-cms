import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ColumnDef<T> {
  header: ReactNode;
  cell: (item: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;
  footer?: ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = "No items found.",
  loadingMessage = "Loading...",
  footer,
}: DataTableProps<T>) {
  return (
    <Card className="rounded-md border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden subtle-shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={`px-6 py-4 font-medium ${col.headerClassName || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading && data.length === 0 ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="group transition-colors">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`px-6 py-4 ${col.cellClassName || ""}`}>
                      <Skeleton className="h-6 w-full max-w-[200px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.map((item) => (
                <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                  {columns.map((col, i) => (
                    <td key={i} className={`px-6 py-4 ${col.cellClassName || ""}`}>
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && data.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      ) : null}
      {!loading && footer}
    </Card>
  );
}
