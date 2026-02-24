"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "./Skeleton";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className="inline-flex flex-col gap-0.5 ml-1.5 opacity-60" aria-hidden="true">
      <svg
        className={cn("h-2 w-2 transition-opacity", direction === "asc" ? "opacity-100" : "opacity-30")}
        viewBox="0 0 8 5"
        fill="currentColor"
      >
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg
        className={cn("h-2 w-2 transition-opacity", direction === "desc" ? "opacity-100" : "opacity-30")}
        viewBox="0 0 8 5"
        fill="currentColor"
      >
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  );
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  emptyDescription,
  className,
  rowKey,
  onRowClick,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-border", className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-surface-secondary border-b border-border">
            {columns.map((col) => {
              const colKey = String(col.key);
              const isSorted = sortKey === colKey;
              const direction: SortDirection = isSorted ? sortDirection : null;

              return (
                <th
                  key={colKey}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-gray-900 hover:bg-gray-100 transition-colors",
                    col.headerClassName
                  )}
                  onClick={col.sortable ? () => handleSort(colKey) : undefined}
                  aria-sort={
                    col.sortable
                      ? direction === "asc"
                        ? "ascending"
                        : direction === "desc"
                        ? "descending"
                        : "none"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center">
                    {col.header}
                    {col.sortable && <SortIcon direction={direction} />}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3">
                    <Skeleton variant="rectangle" height={16} className="rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="h-10 w-10 text-gray-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
                  {emptyDescription && (
                    <p className="text-xs text-gray-400">{emptyDescription}</p>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIdx) => (
              <tr
                key={rowKey ? rowKey(row, rowIdx) : rowIdx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors duration-100",
                  onRowClick && "cursor-pointer hover:bg-gray-50"
                )}
              >
                {columns.map((col) => {
                  const colKey = String(col.key);
                  const rawValue = row[colKey];
                  const cellContent = col.render
                    ? col.render(rawValue, row, rowIdx)
                    : rawValue != null
                    ? String(rawValue)
                    : "-";

                  return (
                    <td
                      key={colKey}
                      className={cn("px-4 py-3 text-gray-700", col.className)}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
