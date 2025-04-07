"use server";

import { createUserSchema, uploadUserSchema } from "@/lib/form-schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import { user } from "./db/schema";

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

type AuthReturnType<T = undefined> =
  | { success: false; error: string }
  | (T extends undefined ? { success: true } : { success: true; data: T });

async function authenticate() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

export async function updateUserRole(
  id: string[],
  role: string,
): Promise<AuthReturnType> {
  // Set role from admin plugin, do not need to check the user's role
  const session = await authenticate();
  if (!session || session.user.role !== "admin")
    return { success: false, error: "Unauthorised" };

  try {
    await db.update(user).set({ role: role }).where(inArray(user.id, id));
    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { success: false, error: e.message };
    else return { success: false, error: "Error updating user's role" };
  }
}

export async function updateUserName(
  id: string,
  name: string,
): Promise<AuthReturnType> {
  const session = await authenticate();
  if (!session || session.user.role !== "admin")
    return { success: false, error: "Unauthorised" };
  try {
    await db
      .update(user)
      .set({
        name: name,
      })
      .where(eq(user.id, id));
    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { success: false, error: e.message };
    else return { success: false, error: "Error updating user's name" };
  }
}

export async function updateUserPassword(
  id: string,
  password: string,
): Promise<AuthReturnType> {
  try {
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        newPassword: password,
        userId: id,
      },
    });
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { success: false, error: e.message };
    else return { success: false, error: "Error updating user's password" };
  }
}

export async function deleteUser(id: string[]): Promise<AuthReturnType> {
  const session = await authenticate();
  if (!session || session.user.role !== "admin")
    return { success: false, error: "Unauthorised" };
  try {
    await db.delete(user).where(inArray(user.id, id));
    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { success: false, error: e.message };
    else return { success: false, error: "Error deleting user" };
  }
}

export async function createUser(
  values: z.infer<typeof createUserSchema>,
): Promise<AuthReturnType> {
  const validation = createUserSchema.safeParse(values);

  if (!validation.success)
    return {
      success: false,
      error: "There is an issue with the information entered",
    };

  try {
    await auth.api.createUser({
      headers: await headers(),
      body: {
        email: values.email,
        name: values.name,
        password: values.password,
        role: values.role,
      },
    });
    revalidatePath("/admin-dashboard");
    return { success: true };
  } catch (e: unknown) {
    if (e instanceof Error) return { success: false, error: e.message };
    else return { success: false, error: "Error creating user" };
  }
}

export async function createMultipleUser(
  values: z.infer<typeof uploadUserSchema>[],
): Promise<AuthReturnType<{ added: number; errors: string[] }>> {
  const header = await headers();

  for (let i = 0; i < values.length; i++) {
    const validation = uploadUserSchema.safeParse(values[i]);

    if (!validation.success) {
      return {
        success: false,
        error: "There is an issue with the information entered",
      };
    }
  }

  // This is NOT the ideal way to do this as we have to auth the user on every createUser call and can thus be quite slow
  const requests = [];
  for (let i = 0; i < values.length; i++) {
    requests.push(
      auth.api
        .createUser({
          headers: header,
          body: {
            email: values[i].email,
            name: values[i].name,
            password: values[i].password,
            role: values[i].role,
          },
        })
        .then(() => true as const)
        .catch((e) => {
          if (e instanceof Error) return e.message + `: ${values[i].email}`;
          throw e;
        }),
    );
  }

  try {
    const result = await Promise.all(requests);
    let successful = 0;
    const errors = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i] !== true) errors.push(result[i] as string);
      else successful += 1;
    }
    revalidatePath("/admin-dashboard");
    return { success: true, data: { added: successful, errors: errors } };
  } catch (e: unknown) {
    if (e instanceof Error) return { success: false, error: e.message };
    else return { success: false, error: "Error creating user" };
  }
}
