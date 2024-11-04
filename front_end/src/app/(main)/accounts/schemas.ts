import { z } from "zod";

import { SubscriptionEmailType } from "@/types/notifications";

export const signInSchema = z.object({
  login: z.string().min(1, { message: "Email/Username is required" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});
export type SignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = z.intersection(
  z.object({
    username: z.string().min(1, { message: "Username is required" }),
    email: z.string().min(1, { message: "Email is required" }),
    isBot: z
      .string()
      .toLowerCase()
      .transform((x) => x === "true")
      .pipe(z.boolean()),
    turnstileToken: z.string({
      required_error: "Turnstile token is required",
    }),
    addToProject: z.string().optional(),
  }),
  z
    .object({
      password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" }),
      passwordAgain: z
        .string()
        .min(8, { message: "Password must be at least 8 characters" }),
    })
    .refine((data) => data.passwordAgain === data.password, {
      message: "The passwords did not match",
      path: ["password"],
    })
);

export type SignUpSchema = z.infer<typeof signUpSchema>;

export const changeUsernameSchema = z
  .object({
    username: z.string().min(1, { message: "Username is required" }),
    usernameConfirm: z.string().min(1, { message: "Username is required" }),
  })
  .superRefine(({ username, usernameConfirm }, ctx) => {
    if (usernameConfirm !== username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Usernames do not match",
        path: ["usernameConfirm"],
      });
    }
  });
export type ChangeUsernameSchema = z.infer<typeof changeUsernameSchema>;

export const updateProfileSchema = z.object({
  bio: z.string().optional(),
  website: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  facebook: z.string().optional(),
  github: z.string().optional(),
  good_judgement_open: z.string().optional(),
  kalshi: z.string().optional(),
  manifold: z.string().optional(),
  infer: z.string().optional(),
  hypermind: z.string().optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export const passwordResetRequestSchema = z.object({
  login: z.string().min(1, { message: "Login is required" }),
});

export type PasswordResetRequestSchema = z.infer<
  typeof passwordResetRequestSchema
>;

export const passwordResetConfirmSchema = z
  .object({
    user_id: z.any(),
    token: z.string(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    passwordAgain: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  })
  .superRefine(({ passwordAgain, password }, ctx) => {
    if (passwordAgain !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The passwords did not match",
        path: ["passwordAgain"],
      });
    }
  });
export type PasswordResetConfirmSchema = z.infer<
  typeof passwordResetConfirmSchema
>;
