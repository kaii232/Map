"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { signIn } from "@/server/auth-actions";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form action={action}>
      <div className="flex flex-col gap-6">
        {state?.field && <p className="text-sm text-red-300">{state.field}</p>}
        <div className="space-y-2">
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
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="forget-password"
              className="text-sm leading-none hover:underline"
            >
              Forget Password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            right={
              <Button
                size="icon"
                variant="ghost"
                type="button"
                className="hover:bg-neutral-200"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            }
          />
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
          Email an administrator
        </a>
      </div>
    </form>
  );
}
