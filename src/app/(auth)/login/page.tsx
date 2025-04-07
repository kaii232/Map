import { auth } from "@/server/auth";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      //@ts-expect-error Better auth bug
      disableRefresh: true,
    },
  });

  if (session) redirect("/");

  return (
    <main className="flex h-svh w-full flex-col items-center justify-center gap-6 bg-neutral-900 p-4">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="Earth Observatory Singapore"
          width={124}
          height={48}
        />
      </Link>
      <div className="flex max-w-sm flex-col gap-6 rounded-2xl border border-neutral-600 bg-neutral-950 p-8 text-neutral-300">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-neutral-50">
            Login
          </h1>
          <p className="text-sm text-neutral-400">
            Enter your email below to login to your account
          </p>
        </div>
        <div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
