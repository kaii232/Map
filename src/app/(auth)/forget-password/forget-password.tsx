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
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Please check your email!" }),
});

const ForgetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.forgetPassword(
      {
        email: values.email,
        redirectTo: "/reset-password",
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
          setSubmitted(true);
        },
      },
    );
  }
  if (submitted)
    return (
      <AuthLayout
        header="Email Sent!"
        description="An email has been sent to your account with a password reset link."
      >
        <Button className="w-full" size="lg" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </AuthLayout>
    );

  return (
    <AuthLayout
      header="Forget Password"
      description="Please enter your email below for a link to reset your password."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-3 space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="email@example.com"
                    {...field}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button size="lg" className="mb-3 w-full" type="submit">
            {isLoading ? <Spinner /> : "Send Reset Link"}
          </Button>
        </form>
      </Form>
      <div className="text-center">
        <Link
          href="/login"
          className="whitespace-nowrap font-medium hover:underline"
        >
          Go Back
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgetPasswordForm;
