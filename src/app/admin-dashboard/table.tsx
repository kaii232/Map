"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDebouncedFunction from "@/lib/use-debounced-function";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { UserWithRole } from "better-auth/plugins";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  KeyRound,
  MoreHorizontal,
  Search,
  Trash,
  UserPen,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

const columnHelper = createColumnHelper<UserWithRole>();

const userColumns = [
  columnHelper.display({
    id: "select",
    header({ table }) {
      return (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="mx-auto block"
        />
      );
    },
    cell({ row }) {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="mx-auto block"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("email", {
    header: "Email",
    enableSorting: true,
    enableHiding: false,
  }),
  columnHelper.accessor("name", {
    header: "Name",
    enableSorting: true,
    enableHiding: false,
  }),
  columnHelper.accessor("role", {
    header: "Role",
    enableSorting: true,
    enableHiding: false,
  }),
  columnHelper.accessor(
    (row) =>
      row.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      }),
    {
      header: "Date Created",
      enableSorting: true,
      enableHiding: false,
    },
  ),
  columnHelper.display({
    id: "actions",
    cell() {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 transition hover:bg-neutral-400/20"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <KeyRound />
              Set Password
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UserPen />
              Set Role
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-300 focus:text-red-400">
              <Trash />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
    maxSize: 48,
  }),
];

export default function DataTable({
  data,
  rowCount,
}: {
  data: UserWithRole[];
  rowCount: number;
}) {
  const table = useReactTable({
    data,
    columns: userColumns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    autoResetPageIndex: true,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    rowCount,
  });

  const searchParams = useSearchParams();
  const path = usePathname();
  const { replace } = useRouter();
  const debounce = useDebouncedFunction();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search.trim()) {
      params.set("search", search.trim());
      params.delete("page");
    } else {
      params.delete("search");
      if (inputRef.current) inputRef.current.value = "";
    }
    replace(`${path}?${params.toString()}`);
  };
  const currentSearch = searchParams.get("search");

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Search users..."
            defaultValue={currentSearch ?? ""}
            onChange={(e) => debounce(() => handleSearch(e.target.value), 300)}
            left={<Search />}
            className="h-10 sm:max-w-80"
          />
          {currentSearch && (
            <Button variant="ghost" onClick={() => handleSearch("")}>
              Reset
              <X />
            </Button>
          )}
        </div>
        {table.getSelectedRowModel().rows.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">
                <CirclePlus />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <UserPen />
                Set Role
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-300 focus:text-red-400">
                <Trash />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="rounded-md border border-neutral-600">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={
                        cell.column.id === "actions"
                          ? { width: cell.column.getSize() }
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={userColumns.length}
                  className="h-[72px] text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex">
        <div className="flex-1 text-sm text-neutral-400">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
