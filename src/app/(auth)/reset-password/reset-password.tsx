"use client";

import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { passwordSchema } from "@/lib/form-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    await authClient.resetPassword(
      {
        newPassword: values.password,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onError: (ctx) => {
          setIsLoading(false);
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          setSuccess(true);
        },
      },
    );
  }

  if (success) {
    return (
      <AuthLayout
        header="Password Reset!"
        description="You can use the new password for all future logins."
      >
        <Button className="w-full" size="lg" asChild>
          <Link href="/login">Login</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      header="Reset Password"
      description="Please enter your new password below."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-3 space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
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
          <Button size="lg" className="w-full" type="submit">
            {isLoading ? <Spinner /> : "Reset Password"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
