"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { signIn } from "@/server/auth-actions";
import { useActionState } from "react";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action}>
      <div className="flex flex-col gap-6">
        {state?.field && <p className="text-sm text-red-300">{state.field}</p>}
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
          />
          {state?.email && (
            <p className="text-sm text-red-300">{state.email}</p>
          )}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input id="password" name="password" type="password" />
          {state?.password && (
            <p className="text-sm text-red-300">{state.password}</p>
          )}
        </div>
        <Button type="submit" className="w-full">
          {pending ? <Spinner /> : "Login"}
        </Button>
      </div>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <a href="#" className="underline underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  );
}
