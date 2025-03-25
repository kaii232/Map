import Header from "@/components/header";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DataTable from "./table";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session || session.user.role !== "admin") redirect("/");

  const queryParams = await searchParams;

  const pageNum = Number.isNaN(Number(queryParams.page))
    ? 0
    : Number(queryParams.page);

  const search = queryParams.search
    ? ({
        searchField: "email",
        searchOperator: "contains",
        searchValue: queryParams.search,
      } as const)
    : {};

  const userAccounts = await auth.api.listUsers({
    headers: requestHeaders,
    query: {
      sortBy: "createdAt",
      sortDirection: "desc",
      limit: 50,
      offset: 50 * pageNum,
      ...search,
    },
  });

  return (
    <>
      <Header />
      <main className="px-4">
        <div className="mx-auto w-full max-w-[1400px] space-y-8 pb-4 pt-16">
          <div>
            <h1 className="mb-1 text-4xl font-semibold text-neutral-50">
              Admin Dashboard
            </h1>
            <p>Manage user accounts</p>
          </div>
          <DataTable data={userAccounts.users} rowCount={userAccounts.total} />
        </div>
      </main>
    </>
  );
}
