"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "@/components/ui/button";
import { FormError, Input, Textarea } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Select from "@/components/ui/select";
import { useAuth } from "@/contexts/auth_context";
import { logError } from "@/utils/core/errors";

import { submitToZapierWebhook } from "../actions";
import { SuccessMessage } from "./success-message";

// Field of Study options
const FIELD_OF_STUDY_OPTIONS = [
  { value: "mathematics", label: "Mathematics" },
  { value: "statistics", label: "Statistics" },
  { value: "economics", label: "Economics" },
  { value: "political_science", label: "Political Science" },
  { value: "international_relations", label: "International Relations" },
  { value: "public_policy", label: "Public Policy" },
  { value: "computer_science", label: "Computer Science" },
  { value: "data_science", label: "Data Science" },
  { value: "psychology", label: "Psychology" },
  { value: "sociology", label: "Sociology" },
  { value: "philosophy", label: "Philosophy" },
  { value: "business", label: "Business" },
  { value: "finance", label: "Finance" },
  { value: "engineering", label: "Engineering" },
  { value: "physics", label: "Physics" },
  { value: "history", label: "History" },
  { value: "english", label: "English" },
  { value: "journalism", label: "Journalism" },
  { value: "law", label: "Law" },
  { value: "other", label: "Other" },
];

// Program Type options
const PROGRAM_TYPE_OPTIONS = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Masters" },
  { value: "phd", label: "PhD" },
  { value: "law", label: "Law" },
  { value: "medicine", label: "Medicine" },
  { value: "other_graduate", label: "Other Graduate Program" },
];

const emailRegistrationSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine((email) => {
      const lowerEmail = email.toLowerCase();
      return (
        lowerEmail.endsWith(".edu") ||
        lowerEmail.endsWith(".ac.uk") ||
        lowerEmail.endsWith(".int") ||
        lowerEmail.endsWith(".mil") ||
        lowerEmail.endsWith("@metaculus.com")
      );
    }, "Please use an eligible email address (.edu, .ac.uk, .int, or .mil)"),
  university: z.string().min(1, "University is required"),
  fieldOfStudy: z.string().min(1, "Field of study is required"),
  programType: z.string().min(1, "Program type is required"),
  hasForecastingTraining: z
    .any()
    .refine((val) => val === "yes" || val === "no", {
      message: "Please select yes or no",
    }),
  hasForecastingExperience: z
    .any()
    .refine((val) => val === "yes" || val === "no", {
      message: "Please select yes or no",
    }),
  motivation: z
    .string()
    .min(
      10,
      "Please provide at least 10 characters explaining your motivation"
    ),
  consentAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the consent form to participate",
  }),
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
    defaultValues: {
      email: "",
      university: "",
      fieldOfStudy: "",
      programType: "",
      hasForecastingTraining: undefined,
      hasForecastingExperience: undefined,
      motivation: "",
      consentAgreed: false,
    },
  });

  const onSubmit = async (data: EmailRegistrationSchema) => {
    setSubmissionState({ status: "loading" });

    try {
      const result = await submitToZapierWebhook(
        data.email,
        user?.username,
        user?.email,
        {
          university: data.university,
          fieldOfStudy: data.fieldOfStudy,
          programType: data.programType,
          hasForecastingTraining: data.hasForecastingTraining === "yes",
          hasForecastingExperience: data.hasForecastingExperience === "yes",
          motivation: data.motivation,
          consentAgreed: data.consentAgreed,
        }
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
    <div className="flex w-full flex-col gap-6 rounded-lg bg-blue-800 p-6 dark:bg-blue-950 md:p-8">
      <div className="text-center">
        <p className="my-0 text-balance text-sm text-white/90 dark:text-gray-200 md:text-base">
          Complete the form below to secure your spot and receive tournament
          updates.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Desktop: 2-column layout, Mobile: single column */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
          {/* Column 1 - Basic Info */}
          <div className="space-y-5">
            <InputContainer
              labelText="Email Address"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <Input
                type="email"
                placeholder="Enter your email address (.edu, .ac.uk, .int or .mil)"
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

            <InputContainer
              labelText="University"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <Input
                type="text"
                placeholder="Enter your university name"
                className="block w-full rounded border border-white/20 bg-white/10 px-3 py-2 font-normal text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-500 dark:focus:bg-gray-600"
                disabled={submissionState.status === "loading"}
                {...register("university")}
              />
              <FormError
                errors={errors}
                name="university"
                className="!text-red-300 dark:!text-red-400"
              />
            </InputContainer>

            <InputContainer
              labelText="Field of Study"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <Select
                options={[
                  {
                    value: "",
                    label: "Select your field of study",
                    disabled: true,
                  },
                  ...FIELD_OF_STUDY_OPTIONS,
                ]}
                className="block w-full rounded border border-white/20 bg-white/10 px-3 py-2 font-normal text-white focus:border-white/40 focus:bg-white/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:bg-gray-600"
                disabled={submissionState.status === "loading"}
                {...register("fieldOfStudy")}
              />
              <FormError
                errors={errors}
                name="fieldOfStudy"
                className="!text-red-300 dark:!text-red-400"
              />
            </InputContainer>

            <InputContainer
              labelText="Program Type"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <Select
                options={[
                  {
                    value: "",
                    label: "Select your program type",
                    disabled: true,
                  },
                  ...PROGRAM_TYPE_OPTIONS,
                ]}
                className="block w-full rounded border border-white/20 bg-white/10 px-3 py-2 font-normal text-white focus:border-white/40 focus:bg-white/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-gray-500 dark:focus:bg-gray-600"
                disabled={submissionState.status === "loading"}
                {...register("programType")}
              />
              <FormError
                errors={errors}
                name="programType"
                className="!text-red-300 dark:!text-red-400"
              />
            </InputContainer>
          </div>

          {/* Column 2 - Experience & Motivation */}
          <div className="space-y-5">
            <InputContainer
              labelText="Have you ever taken a forecasting training course?"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center text-white/90 dark:text-gray-200">
                  <input
                    type="radio"
                    value="yes"
                    className="mr-2 h-4 w-4 border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                    disabled={submissionState.status === "loading"}
                    {...register("hasForecastingTraining")}
                  />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center text-white/90 dark:text-gray-200">
                  <input
                    type="radio"
                    value="no"
                    className="mr-2 h-4 w-4 border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                    disabled={submissionState.status === "loading"}
                    {...register("hasForecastingTraining")}
                  />
                  No
                </label>
              </div>
              <FormError
                errors={errors}
                name="hasForecastingTraining"
                className="!text-red-300 dark:!text-red-400"
              />
            </InputContainer>

            <InputContainer
              labelText="Have you ever forecast on any platform before?"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <div className="flex gap-6">
                <label className="flex cursor-pointer items-center text-white/90 dark:text-gray-200">
                  <input
                    type="radio"
                    value="yes"
                    className="mr-2 h-4 w-4 border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                    disabled={submissionState.status === "loading"}
                    {...register("hasForecastingExperience")}
                  />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center text-white/90 dark:text-gray-200">
                  <input
                    type="radio"
                    value="no"
                    className="mr-2 h-4 w-4 border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                    disabled={submissionState.status === "loading"}
                    {...register("hasForecastingExperience")}
                  />
                  No
                </label>
              </div>
              <FormError
                errors={errors}
                name="hasForecastingExperience"
                className="!text-red-300 dark:!text-red-400"
              />
            </InputContainer>

            <InputContainer
              labelText="Motivation for participating in competition"
              className="[&>label]:!text-white/90 dark:[&>label]:!text-gray-200"
            >
              <Textarea
                placeholder="Please describe your motivation for participating in this forecasting competition..."
                className="block min-h-[100px] w-full rounded border border-white/20 bg-white/10 px-3 py-2 font-normal text-white placeholder:text-white/60 focus:border-white/40 focus:bg-white/15 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-500 dark:focus:bg-gray-600"
                disabled={submissionState.status === "loading"}
                {...register("motivation")}
              />
              <FormError
                errors={errors}
                name="motivation"
                className="!text-red-300 dark:!text-red-400"
              />
            </InputContainer>
          </div>
        </div>

        {/* Full-width sections - Consent and Submit */}
        <div className="mx-auto max-w-xl space-y-5 pt-2">
          <div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consentAgreed"
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                disabled={submissionState.status === "loading"}
                {...register("consentAgreed")}
              />
              <label
                htmlFor="consentAgreed"
                className="cursor-pointer text-sm text-white/90 dark:text-gray-200"
              >
                I consent to participate in this research and agree to the{" "}
                <a
                  href="/rand/consent-form"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline hover:text-white/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  consent form
                </a>
                .
              </label>
            </div>
            <FormError
              errors={errors}
              name="consentAgreed"
              className="!text-red-300 dark:!text-red-400"
            />
          </div>

          {submissionState.status === "error" && (
            <div className="text-sm font-normal !text-red-300 dark:!text-red-400">
              {submissionState.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={submissionState.status === "loading"}
            className="w-full bg-blue-950 hover:bg-blue-900"
            variant="primary"
          >
            {submissionState.status === "loading" ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Submitting...
              </div>
            ) : (
              "Register for Tournament"
            )}
          </Button>
        </div>
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
            Sign up with your .edu, .ac.uk, .int, or .mil email to participate.
            You can still use this account for the tournament.
          </p>
        </div>
      )}
    </div>
  );
};
