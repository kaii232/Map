import { z } from "zod";

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long!")
      .max(128, "Maximum password length exceeded"),
    confirm: z.string().min(1, "Please confirm password!"),
  })
  .refine((values) => values.confirm === values.password, {
    message: "Passwords are not the same!",
    path: ["confirm"],
  });
