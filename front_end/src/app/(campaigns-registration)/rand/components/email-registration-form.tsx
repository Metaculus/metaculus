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
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      const lowerEmail = email.toLowerCase();
      return (
        lowerEmail.endsWith(".edu") || lowerEmail.endsWith("@metaculus.com")
      );
    }, "Please use a university email address ending in .edu"),
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
  });

  const onSubmit = async (data: EmailRegistrationSchema) => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await submitToZapierWebhook(
        data.email,
        user?.username,
        user?.email
      );

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
    <div className="flex w-full flex-col gap-6 rounded-lg bg-blue-700 p-8 dark:bg-blue-950">
      <div className="text-center">
        <p className="my-0 text-balance text-sm text-white/90 dark:text-gray-200 md:text-base">
          Reserve your spot now to get forecasting resources and a heads-up when
          the tournament launches.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputContainer
          labelText="Email Address"
          className="[&_label]:!text-white/90 dark:[&_label]:!text-gray-200 [&_span]:!text-white/90 dark:[&_span]:!text-gray-200"
        >
          <Input
            type="email"
            placeholder="Enter your university .edu email address"
            className="block w-full rounded border border-white/20 bg-white/10 px-3 py-2 font-normal text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-500 dark:focus:bg-gray-600"
            disabled={isLoading}
            {...register("email")}
          />
          <FormError
            errors={errors}
            name="email"
            className="[&>div>span]:!font-normal [&>div>span]:!text-red-500 [&_span]:!font-normal [&_span]:!text-red-500"
          />
        </InputContainer>

        {error && (
          <div className="text-sm font-normal !text-red-500">{error}</div>
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
        <div className="my-0 text-center text-xs text-white/70 dark:text-gray-400">
          <p className="mb-1">
            Logged in as{" "}
            <strong className="text-white/90 dark:text-gray-200">
              {user.username}
            </strong>
            {user.email && (
              <>
                {" "}
                (
                <strong className="text-white/90 dark:text-gray-200">
                  {user.email}
                </strong>
                )
              </>
            )}
          </p>
          <p className="text-xs">
            Sign up with your .edu email to participate. You can still use this
            account for the tournament.
          </p>
        </div>
      )}
    </div>
  );
};
