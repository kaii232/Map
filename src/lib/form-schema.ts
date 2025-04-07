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

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters long!" }),
    email: z.string().email({ message: "Please check your email!" }),
    role: z.enum(["admin", "user"]),
    password: z
      .string({ required_error: "Please enter a password!" })
      .min(8, {
        message: "The password needs to be at least 8 characters long!",
      })
      .max(128, { message: "The password is too long!" }),
    confirm: z
      .string({ required_error: "Please confirm your password!" })
      .min(1, { message: "Please confirm your password!" }),
  })
  .refine((values) => values.confirm === values.password, {
    message: "Passwords are not the same!",
    path: ["confirm"],
  });

export const uploadUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long!" }),
  email: z.string().email({ message: "Please check your email!" }),
  role: z.enum(["admin", "user"]).optional(),
  password: z
    .string({ required_error: "Please enter a password!" })
    .min(8, {
      message: "The password needs to be at least 8 characters long!",
    })
    .max(128, { message: "The password is too long!" }),
});
