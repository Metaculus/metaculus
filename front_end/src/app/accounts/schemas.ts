import { z } from "zod";

export const signInSchema = z.object({
  login: z.string().min(1, { message: "Email/Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});
export type SignInSchema = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    username: z.string().min(1, { message: "Username is required" }),
    password: z.string().min(1, { message: "Password is required" }),
    passwordAgain: z.string().min(1, { message: "Password is required" }),
    email: z.string().min(1, { message: "Password is required" }),
  })
  .superRefine(({ passwordAgain, password }, ctx) => {
    if (passwordAgain !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["passwordAgain"],
      });
    }
  });
export type SignUpSchema = z.infer<typeof signUpSchema>;

export const changeUsernameSchema = z
  .object({
    username: z.string().min(1, { message: "Username is required" }),
    usernameConfirm: z.string().min(1, { message: "Username is required" }),
  })
  .superRefine(({ username, usernameConfirm }, ctx) => {
    if (usernameConfirm !== username) {
      ctx.addIssue({
        code: "custom",
        message: "Usernames do not match",
        path: ["usernameConfirm"],
      });
    }
  });
export type ChangeUsernameSchema = z.infer<typeof changeUsernameSchema>;

export const updateProfileSchema = z.object({
  bio: z.string(),
  website: z.string(),
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
    password: z.string().min(1, { message: "Password is required" }),
    passwordAgain: z.string().min(1, { message: "Password is required" }),
  })
  .superRefine(({ passwordAgain, password }, ctx) => {
    if (passwordAgain !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["passwordAgain"],
      });
    }
  });
export type PasswordResetConfirmSchema = z.infer<
  typeof passwordResetConfirmSchema
>;
