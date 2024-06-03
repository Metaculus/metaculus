import { z } from "zod";

export const signInSchema = z.object({
  login: z.string().min(1, { message: "Email/Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});
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
export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
