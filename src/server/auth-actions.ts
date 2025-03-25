"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "./auth";

const signInFormSchema = z.object({
  email: z
    .string({ message: "Please enter your email!" })
    .email({ message: "Please check your email!" }),
  password: z
    .string({ message: "Please enter a password!" })
    .min(1, { message: "Please enter a password!" }),
});

export async function signIn(
  state:
    | {
        email?: string[];
        password?: string[];
        field?: string;
      }
    | null
    | undefined,
  formData: FormData,
): Promise<{
  email?: string[];
  password?: string[];
  field?: string;
}> {
  const email = formData.get("email");
  const password = formData.get("password");
  const validation = signInFormSchema.safeParse({
    email: email,
    password: password,
  });

  if (!validation.success) {
    return validation.error.flatten().fieldErrors;
  }
  try {
    await auth.api.signInEmail({
      body: {
        email: email as string,
        password: password as string,
      },
    });
  } catch (e: unknown) {
    if (e instanceof Error) return { field: e.message };
    return { field: "An error has occurred" };
  }
  return redirect("/");
}
