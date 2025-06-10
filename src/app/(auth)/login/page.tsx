import AuthLayout from "@/components/auth-layout";
import { auth } from "@/server/auth";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your EOS Invest account",
};

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableRefresh: true,
    },
  });

  if (session) redirect("/");

  return (
    <AuthLayout
      header="Login"
      description="Enter your email below to login to your account"
    >
      <LoginForm />
    </AuthLayout>
  );
}
