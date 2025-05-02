import Header from "@/components/header";
import SignOut from "@/components/sign-out";
import { auth } from "@/server/auth";
import { IdCard, Mail, User } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account",
  description: "User account page",
};

function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableRefresh: true,
    },
  });

  if (!session) redirect("/login");

  return (
    <>
      <Header />
      <main className="px-4">
        <div className="mx-auto w-full max-w-4xl space-y-8 pb-4 pt-16">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-neutral-50">
                My Account
              </h1>
              <p>View your account details</p>
            </div>
            <SignOut />
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-neutral-300">
              Personal Information
            </h3>
            <div className="grow space-y-4">
              <div className="flex w-full items-center gap-6 rounded-lg bg-neutral-900 px-6 py-3">
                <Mail className="shrink-0" />
                <div className="min-w-0 space-y-1">
                  <h6 className="text-sm font-medium text-neutral-300">
                    Email
                  </h6>
                  <p className="truncate text-neutral-50">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center gap-6 rounded-lg bg-neutral-900 px-6 py-3">
                <User className="shrink-0" />
                <div className="min-w-0 space-y-1">
                  <h6 className="text-sm font-medium text-neutral-300">Name</h6>
                  <p className="truncate text-neutral-50">
                    {session.user.name}
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center gap-6 rounded-lg bg-neutral-900 px-6 py-3">
                <IdCard className="shrink-0" />
                <div className="min-w-0 space-y-1">
                  <h6 className="text-sm font-medium text-neutral-300">Role</h6>
                  <p className="truncate text-neutral-50">
                    {capitalizeFirstLetter(session.user.role ?? "User")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
