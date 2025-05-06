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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createUserSchema,
  passwordSchema,
  uploadUserSchema,
} from "@/lib/form-schema";
import useDebouncedFunction from "@/lib/use-debounced-function";
import {
  createMultipleUser,
  createUser,
  deleteUser,
  updateUserName,
  updateUserPassword,
  updateUserRole,
} from "@/server/auth-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { UserWithRole } from "better-auth/plugins";
import { parse } from "csv-parse/sync";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  Upload,
  UserPen,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const columnHelper = createColumnHelper<UserWithRole>();

export default function DataTable({
  data,
  rowCount,
  pageSize,
}: {
  data: UserWithRole[];
  rowCount: number;
  pageSize: number;
}) {
  const [editNameOpen, setEditNameOpen] = useState<
    { id: string; currentName: string } | undefined
  >(undefined);
  const [editPasswordOpen, setEditPasswordOpen] = useState<
    { id: string } | undefined
  >(undefined);
  const [editRoleOpen, setEditRoleOpen] = useState<
    { id: string[]; currentRole: string } | undefined
  >(undefined);
  const [deleteOpen, setDeleteOpen] = useState<{ id: string[] } | undefined>(
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
                  className="size-8 hover:bg-neutral-400/20"
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
                      id: [row.original.id],
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
                      id: [row.original.id],
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
        pageSize: pageSize,
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
      table.setPageIndex(0);
    } else {
      params.delete("search");
      if (inputRef.current) inputRef.current.value = "";
    }
    params.delete("page");
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
  const pageNum = Number(currentPage) || 0;

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
        <div className="flex flex-col gap-2 sm:flex-row">
          <CreateUserDialog />
          {table.getSelectedRowModel().rows.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <CirclePlus />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    let allAdmins = true;
                    setEditRoleOpen({
                      id: table.getSelectedRowModel().rows.map((row) => {
                        if (row.original.role !== "admin") allAdmins = false;
                        return row.original.id;
                      }),
                      currentRole: allAdmins ? "admin" : "user",
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
                      id: table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original.id),
                    });
                  }}
                >
                  <Trash />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="w-full overflow-auto rounded-2xl border border-neutral-600">
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
        key={editRoleOpen?.id[0]}
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
        onDeleteSuccess={() => table.toggleAllRowsSelected(false)}
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
          <Input ref={inputRef} id="name" defaultValue={open?.currentName} />
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
            <Input ref={inputRef} id="password" type="password" />
            {error?.password && (
              <p className="text-sm text-red-300">{error.password[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Confirm Password</Label>
            <Input ref={cfmInputRef} id="new-password" type="password" />
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
  open: { id: string[]; currentRole: string } | undefined;
  onOpenChange: (open: boolean) => void;
}) => {
  const [value, setValue] = useState(open?.currentRole ?? "user");
  const [isLoading, setIsLoading] = useState(false);
  const onSave = async () => {
    if (!open) return;
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
  onDeleteSuccess,
}: {
  open: { id: string[] } | undefined;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const onDelete = async () => {
    if (!open) return;
    setIsLoading(true);
    const res = await deleteUser(open.id);
    if (!res.success) toast.error(res.error);
    else {
      onOpenChange(false);
      if (onDeleteSuccess) onDeleteSuccess();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={!!open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {open && open.id.length > 1
              ? "Deleter Multiple Users"
              : "Delete User"}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete{" "}
            {open && open.id.length > 1 ? "these users?" : "this user?"}
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

const CreateUserDialog = () => {
  const form = useForm<z.infer<typeof createUserSchema>>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      password: "",
      confirm: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [csvUsers, setCsvUsers] = useState<
    | {
        name: string;
        users: z.infer<typeof uploadUserSchema>[];
      }
    | undefined
  >(undefined);

  const validationErrorsArr = useMemo(
    () => csvUsers?.users.map((user) => uploadUserSchema.safeParse(user)),
    [csvUsers],
  );

  async function onSubmit(values: z.infer<typeof createUserSchema>) {
    startTransition(async () => {
      const res = await createUser(values);
      if (!res.success) toast.error(res.error);
      else {
        toast.success("User created successfully!");
        form.reset();
      }
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !(
        file.type === ".csv" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv"
      )
    ) {
      toast.error("Please upload a file in the CSV format!");
      return;
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onloadend = () => {
      if (typeof reader.result !== "string") return;
      console.log(reader.result.trim());
      const records = parse(reader.result.trim(), {
        columns: (header) =>
          header.map((column: string) => column.toLowerCase()),
        skip_empty_lines: true,
        skip_records_with_empty_values: true,
        trim: true,
      });
      console.log(records);
      setCsvUsers({ name: file.name, users: records });
    };
  }

  const handleCSVCreate = () => {
    if (!csvUsers) return;
    startTransition(async () => {
      const res = await createMultipleUser(csvUsers.users);
      if (!res.success) toast.error(res.error);
      else {
        if (res.data.added)
          toast.success(`Created ${res.data.added} users successfully!`);
        if (Array.isArray(res.data.errors) && res.data.errors.length > 0)
          res.data.errors.forEach((error) => toast.error(error));
        setCsvUsers(undefined);
      }
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent>
        {csvUsers && csvUsers.users.length > 0 ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Users</DialogTitle>
              <DialogDescription>
                Verify the users uploaded as shown below. Highlighted cells
                indicate errors. Please fix these errors if there are any before
                trying again.
              </DialogDescription>
              <Button variant="ghost" onClick={() => setCsvUsers(undefined)}>
                {csvUsers.name}
                <X />
              </Button>
            </DialogHeader>
            <div className="relative max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="bg-background sticky top-0">
                      Email
                    </TableHead>
                    <TableHead className="bg-background sticky top-0">
                      Name
                    </TableHead>
                    <TableHead className="bg-background sticky top-0">
                      Password
                    </TableHead>
                    <TableHead className="bg-background sticky top-0">
                      Role
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvUsers.users.map((csvUser, index) => {
                    const validationErrors =
                      validationErrorsArr![index].error?.flatten().fieldErrors;
                    return (
                      <TableRow key={csvUser.email}>
                        {validationErrors?.email ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <TableCell className="bg-red-800">
                                {csvUser.email}
                              </TableCell>
                            </TooltipTrigger>
                            <TooltipContent>
                              {validationErrors.email.join(" ")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <TableCell>{csvUser.email}</TableCell>
                        )}
                        {validationErrors?.name ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <TableCell className="bg-red-800">
                                {csvUser.name}
                              </TableCell>
                            </TooltipTrigger>
                            <TooltipContent>
                              {validationErrors.name.join(" ")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <TableCell>{csvUser.name}</TableCell>
                        )}
                        {validationErrors?.password ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <TableCell className="bg-red-800">
                                {csvUser.password}
                              </TableCell>
                            </TooltipTrigger>
                            <TooltipContent>
                              {validationErrors.password.join(" ")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <TableCell>{csvUser.password}</TableCell>
                        )}
                        {validationErrors?.role ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <TableCell className="bg-red-800">
                                {csvUser.role ?? "user"}
                              </TableCell>
                            </TooltipTrigger>
                            <TooltipContent>
                              {validationErrors.role.join(" ")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <TableCell>{csvUser.role ?? "user"}</TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCSVCreate}
                disabled={
                  !validationErrorsArr ||
                  validationErrorsArr.some((valid) => !valid.success) ||
                  isPending
                }
              >
                {isPending ? <Spinner className="size-4" /> : "Create"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
              <DialogDescription>
                Fill in the fields below to create a new user. Optionally,
                upload a single CSV containing a list of users you wish to
                create. Please use the following{" "}
                <Link
                  href="user_create_template.csv"
                  download
                  prefetch={false}
                  className="font-semibold text-neutral-50 hover:underline"
                >
                  template
                </Link>{" "}
                for uploading.
              </DialogDescription>
              <Button
                variant="ghost"
                className="w-full cursor-pointer text-center"
                asChild
              >
                <Label>
                  <Upload /> Upload CSV
                  <Input
                    type="file"
                    hidden
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                </Label>
              </Button>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="mb-3 space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@example.com"
                          {...field}
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value as string}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          right={
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label="Toggle password visibility"
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          right={
                            <Button
                              size="icon"
                              variant="ghost"
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label="Toggle password visibility"
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Spinner className="size-4" /> : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
