"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useActionState } from "react";
import { useForm } from "react-hook-form";

import alphaLoginAction, {
  AlphaLoginActionState,
} from "@/app/alpha-auth/actions";
import { DevLoginSchema, devLoginSchema } from "@/app/alpha-auth/schemas";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";

const DevLogin: FC = () => {
  const { register } = useForm<DevLoginSchema>({
    resolver: zodResolver(devLoginSchema),
  });
  const [state, formAction] = useActionState<AlphaLoginActionState, FormData>(
    alphaLoginAction,
    null
  );

  return (
    <main className="mx-auto mt-10 flex w-96 flex-col">
      <h1>Alpha Sign In</h1>
      <form action={formAction}>
        <Input
          autoComplete="username"
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="text"
          placeholder="Access token"
          {...register("token")}
          errors={state?.errors}
        />
        <FormError errors={state?.errors} />
        <Button variant="primary" className="mt-2 w-full" type="submit">
          Login
        </Button>
      </form>
    </main>
  );
};

export default DevLogin;
