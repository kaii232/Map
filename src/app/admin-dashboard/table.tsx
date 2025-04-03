"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Spinner from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { passwordSchema } from "@/lib/form-schema";
import useDebouncedFunction from "@/lib/use-debounced-function";
import {
  deleteUser,
  updateUserName,
  updateUserPassword,
  updateUserRole,
} from "@/server/auth-actions";
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
  IdCard,
  KeyRound,
  MoreHorizontal,
  Search,
  Trash,
  UserPen,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const columnHelper = createColumnHelper<UserWithRole>();

export default function DataTable({
  data,
  rowCount,
}: {
  data: UserWithRole[];
  rowCount: number;
}) {
  const [editNameOpen, setEditNameOpen] = useState<
    { id: string; currentName: string } | undefined
  >(undefined);
  const [editPasswordOpen, setEditPasswordOpen] = useState<
    { id: string } | undefined
  >(undefined);
  const [editRoleOpen, setEditRoleOpen] = useState<
    { id: string; currentRole: string } | undefined
  >(undefined);
  const [deleteOpen, setDeleteOpen] = useState<{ id: string } | undefined>(
    undefined,
  );

  const userColumns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header({ table }) {
          return (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
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
        cell({ row }) {
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
                <DropdownMenuItem
                  onSelect={() => {
                    setEditNameOpen({
                      id: row.original.id,
                      currentName: row.original.name,
                    });
                  }}
                >
                  <IdCard /> Edit Name
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditPasswordOpen({
                      id: row.original.id,
                    });
                  }}
                >
                  <KeyRound />
                  Set Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    setEditRoleOpen({
                      id: row.original.id,
                      currentRole: row.original.role ?? "user",
                    });
                  }}
                >
                  <UserPen />
                  Set Role
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-300 focus:text-red-400"
                  onSelect={() => {
                    setDeleteOpen({
                      id: row.original.id,
                    });
                  }}
                >
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
    ],
    [],
  );
  const table = useReactTable({
    data,
    columns: userColumns,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
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
      table.setPageIndex(0);
    } else {
      params.delete("search");
      if (inputRef.current) inputRef.current.value = "";
    }
    replace(`${path}?${params.toString()}`);
  };
  const changePage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 0) {
      params.delete("page");
    } else {
      params.set("page", `${page}`);
    }
    replace(`${path}?${params.toString()}`);
  };
  const currentSearch = searchParams.get("search");
  const currentPage = searchParams.get("page");
  const pageNum = Number.isNaN(Number(currentPage)) ? 0 : Number(currentPage);

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
            onClick={() => {
              table.setPageIndex(0);
              changePage(0);
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              table.previousPage();
              changePage(pageNum - 1);
            }}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => {
              table.nextPage();
              changePage(pageNum + 1);
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => {
              table.setPageIndex(table.getPageCount() - 1);
              changePage(table.getPageCount() - 1);
            }}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
      <EditNameDialog
        open={editNameOpen}
        onOpenChange={(open) => {
          if (!open) setEditNameOpen(undefined);
        }}
      />
      <EditRoleDialog
        open={editRoleOpen}
        onOpenChange={(open) => {
          if (!open) setEditRoleOpen(undefined);
        }}
        key={editRoleOpen?.id}
      />
      <SetPasswordDialog
        open={editPasswordOpen}
        onOpenChange={(open) => {
          if (!open) setEditPasswordOpen(undefined);
        }}
      />
      <DeleteUserDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteOpen(undefined);
        }}
      />
    </div>
  );
}

const EditNameDialog = ({
  open,
  onOpenChange,
}: {
  open: { id: string; currentName: string } | undefined;
  onOpenChange: (open: boolean) => void;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const onSave = async () => {
    if (!inputRef.current) return;
    if (!open || open.currentName === inputRef.current.value) return;
    setIsLoading(true);
    const res = await updateUserName(open.id, inputRef.current.value);
    if (!res.success) toast.error(res.error);
    else onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Name</DialogTitle>
          <DialogDescription>Change the name of the user.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            ref={inputRef}
            id="name"
            autoFocus
            defaultValue={open?.currentName}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading} onClick={onSave}>
            {isLoading ? <Spinner className="size-4" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SetPasswordDialog = ({
  open,
  onOpenChange,
}: {
  open: { id: string } | undefined;
  onOpenChange: (open: boolean) => void;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cfmInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    password?: string[];
    confirm?: string[];
  }>();

  const onSave = async () => {
    if (!inputRef.current || !cfmInputRef.current || !open) return;
    const password = inputRef.current.value;
    const validation = passwordSchema.safeParse({
      password: password,
      confirm: cfmInputRef.current.value,
    });
    if (!validation.success) {
      setError(validation.error.flatten().fieldErrors);
      return;
    }
    setError(undefined);
    setIsLoading(true);
    const res = await updateUserPassword(open.id, password);
    if (!res.success) toast.error(res.error);
    else onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Password</DialogTitle>
          <DialogDescription>Give the user a new password.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input ref={inputRef} id="password" type="password" autoFocus />
            {error?.password && (
              <p className="text-sm text-red-300">{error.password[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Confirm Password</Label>
            <Input
              ref={cfmInputRef}
              id="new-password"
              type="password"
              autoFocus
            />
            {error?.confirm && (
              <p className="text-sm text-red-300">{error.confirm[0]}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isLoading} onClick={onSave}>
            {isLoading ? <Spinner className="size-4" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EditRoleDialog = ({
  open,
  onOpenChange,
}: {
  open: { id: string; currentRole: string } | undefined;
  onOpenChange: (open: boolean) => void;
}) => {
  const [value, setValue] = useState(open?.currentRole ?? "user");
  const [isLoading, setIsLoading] = useState(false);
  const onSave = async () => {
    if (!open || open.currentRole === value) return;
    setIsLoading(true);
    const res = await updateUserRole(open.id, value);
    if (!res.success) toast.error(res.error);
    else onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>Change the role of the user.</DialogDescription>
        </DialogHeader>
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button type="submit" disabled={isLoading} onClick={onSave}>
            {isLoading ? <Spinner className="size-4" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DeleteUserDialog = ({
  open,
  onOpenChange,
}: {
  open: { id: string } | undefined;
  onOpenChange: (open: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const onDelete = async () => {
    if (!open) return;
    setIsLoading(true);
    const res = await deleteUser(open.id);
    if (!res.success) toast.error(res.error);
    else onOpenChange(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete this
            user?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="submit"
            disabled={isLoading}
            onClick={onDelete}
            className="bg-rose-900 text-rose-50 hover:bg-rose-900/90"
          >
            {isLoading ? <Spinner className="size-4" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
