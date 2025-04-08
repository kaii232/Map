import Header from "@/components/header";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";
import { and, count, desc, like, ne, or, sql } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DataTable from "./table";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "View and edit user accounts",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
    query: {
      //@ts-expect-error Better auth bug
      disableRefresh: true,
    },
  });

  if (!session || session.user.role !== "admin") redirect("/");

  const queryParams = await searchParams;

  const pageNum = Number.isNaN(Number(queryParams.page))
    ? 0
    : Number(queryParams.page);

  const [accounts, total] = await Promise.all([
    db
      .select()
      .from(user)
      .where(
        queryParams.search
          ? and(
              or(
                like(
                  sql.raw(`lower(${user.email.name})`),
                  `%${queryParams.search.toLowerCase()}%`,
                ),
                like(
                  sql.raw(`lower(${user.name.name})`),
                  `%${queryParams.search.toLowerCase()}%`,
                ),
              ),
              ne(user.email, "admin@ntu.com"),
            )
          : ne(user.email, "admin@ntu.com"),
      )
      .orderBy(desc(user.createdAt))
      .limit(50)
      .offset(50 * pageNum),
    db
      .select({ count: count() })
      .from(user)
      .where(
        queryParams.search
          ? and(
              or(
                like(
                  sql.raw(`lower(${user.email.name})`),
                  `%${queryParams.search.toLowerCase()}%`,
                ),
                like(
                  sql.raw(`lower(${user.name.name})`),
                  `%${queryParams.search.toLowerCase()}%`,
                ),
              ),
              ne(user.email, "admin@ntu.com"),
            )
          : ne(user.email, "admin@ntu.com"),
      ),
  ]);

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
          <DataTable data={accounts} rowCount={total[0].count} />
        </div>
      </main>
    </>
  );
}
