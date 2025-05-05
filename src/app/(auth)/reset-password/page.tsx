import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./reset-password";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const error = params.error;
  if (!error && (!token || Array.isArray(token))) redirect("/");

  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableRefresh: true,
    },
  });

  if (session) redirect("/");

  if (error)
    return (
      <AuthLayout
        header="Invalid Link"
        description="This link has already been used or is no longer active."
      >
        <Button asChild className="w-full" size="lg">
          <Link href="/">Return Home</Link>
        </Button>
      </AuthLayout>
    );

  return <ResetPasswordForm />;
}
