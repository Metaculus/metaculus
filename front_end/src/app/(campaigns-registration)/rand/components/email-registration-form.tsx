"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import { logError } from "@/utils/core/errors";

import { submitToZapierWebhook } from "../actions";
import { SuccessMessage } from "./success-message";

const emailRegistrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type EmailRegistrationSchema = z.infer<typeof emailRegistrationSchema>;

export const EmailRegistrationForm: FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const [error, setError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailRegistrationSchema>({
    resolver: zodResolver(emailRegistrationSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: EmailRegistrationSchema) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await submitToZapierWebhook(data.email, user?.username);

      if (result.success) {
        setSubmittedEmail(data.email);
        setIsSuccess(true);
        reset();
      } else {
        setError(result.error || "Failed to submit registration");
      }
    } catch (e) {
      logError(e);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return <SuccessMessage email={submittedEmail} />;
  }

  return (
    <div className="w-full rounded bg-white dark:bg-blue-100-dark">
      <p className="mb-4 text-balance text-center text-sm text-olive-700 dark:text-olive-600-dark md:text-base">
        Get notified when the tournament begins and receive exclusive updates.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputContainer labelText="Email Address">
          <Input
            type="email"
            placeholder="Enter your email address"
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 font-normal dark:border-gray-700-dark"
            disabled={isLoading}
            {...register("email")}
          />
          <FormError errors={errors} name="email" />
        </InputContainer>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
          variant="primary"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Submitting...
            </div>
          ) : (
            "Pre-register"
          )}
        </Button>
      </form>

      {user && (
        <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          Logged in as <strong>{user.username}</strong>
        </p>
      )}
    </div>
  );
};
