import { auth } from "@/server/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ForgetPasswordForm from "./forget-password";

export const metadata: Metadata = {
  title: "Forget Password",
};

export default async function ForgetPasswordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableRefresh: true,
    },
  });

  if (session) redirect("/");

  return <ForgetPasswordForm />;
}
