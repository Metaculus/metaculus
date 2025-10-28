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

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

export const EmailRegistrationForm: FC = () => {
  const { user } = useAuth();
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailRegistrationSchema>({
    resolver: zodResolver(emailRegistrationSchema),
  });

  const onSubmit = async (data: EmailRegistrationSchema) => {
    setSubmissionState({ status: "loading" });

    try {
      const result = await submitToZapierWebhook(
        data.email,
        user?.username,
        user?.email
      );

      if (result.success) {
        setSubmissionState({ status: "success", email: data.email });
        reset();
      } else {
        setSubmissionState({
          status: "error",
          message: result.error || "Failed to submit registration",
        });
      }
    } catch (e) {
      logError(e);
      setSubmissionState({
        status: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  if (submissionState.status === "success") {
    return <SuccessMessage email={submissionState.email} />;
  }

  return (
    <div className="flex w-full flex-col gap-6 rounded-lg bg-blue-700 p-6 dark:bg-blue-950 md:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputContainer
          labelText="Email Address"
          className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
        >
          <Input
            type="email"
            placeholder="Enter your email address"
            className="block w-full rounded border border-white/20 bg-white/10 px-3 py-2 font-normal text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-500 dark:focus:bg-gray-600"
            disabled={submissionState.status === "loading"}
            {...register("email")}
          />
          <FormError
            errors={errors}
            name="email"
            className="!text-red-300 dark:!text-red-400"
          />
        </InputContainer>

        {submissionState.status === "error" && (
          <div className="text-sm font-normal !text-red-300 dark:!text-red-400">
            {submissionState.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={submissionState.status === "loading"}
          className="w-full"
          variant="primary"
        >
          {submissionState.status === "loading" ? (
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
        </div>
      )}
    </div>
  );
};
