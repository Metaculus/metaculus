"use client";

import { useTranslations } from "next-intl";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

import { FormErrorMessage, Input, Textarea } from "@/components/ui/form_field";
import cn from "@/utils/core/cn";

import ServicesQuizStepShell from "./services_quiz_step_shell";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";
import { contactSchema } from "../quiz_state/services_quiz_completion_provider";
import { useServicesQuizFlow } from "../quiz_state/services_quiz_flow_provider";

type ValidationKey = "fieldRequired" | "invalidEmail";

const ServicesQuizStep5: React.FC = () => {
  const t = useTranslations();
  const { goNext, isSubmitting } = useServicesQuizFlow();
  const {
    state,
    setContactName,
    setContactEmail,
    setContactOrg,
    setContactComments,
  } = useServicesQuizAnswers();

  const [showErrors, setShowErrors] = useState(false);

  const validation = useMemo(() => {
    return contactSchema.safeParse({
      contactName: state.contactName,
      contactEmail: state.contactEmail,
      contactOrg: state.contactOrg,
      contactComments: state.contactComments,
    });
  }, [
    state.contactName,
    state.contactEmail,
    state.contactOrg,
    state.contactComments,
  ]);

  const errors = useMemo(() => {
    if (validation.success) return {};
    const f = validation.error.format();
    return {
      contactName: f.contactName?._errors?.[0],
      contactEmail: f.contactEmail?._errors?.[0],
    };
  }, [validation]);

  const canSubmit = validation.success;

  const commentsRef = useRef<HTMLTextAreaElement | null>(null);

  const MAX_ROWS = 5;

  const syncCommentsHeight = () => {
    const el = commentsRef.current;
    if (!el) return;

    const styles = window.getComputedStyle(el);

    const lineHeight = Number.parseFloat(styles.lineHeight || "20");
    const paddingY =
      Number.parseFloat(styles.paddingTop || "0") +
      Number.parseFloat(styles.paddingBottom || "0");
    const borderY =
      Number.parseFloat(styles.borderTopWidth || "0") +
      Number.parseFloat(styles.borderBottomWidth || "0");

    const maxHeight = lineHeight * MAX_ROWS + paddingY + borderY;

    el.style.height = "0px";
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!validation.success) return;
    await goNext();
  };

  useLayoutEffect(() => {
    syncCommentsHeight();
  }, [state.contactComments]);

  const inputClassName = cn(
    "w-full rounded-lg px-3 py-2 text-base leading-5 outline-none transition-colors",
    "min-h-10",
    "border border-gray-200 bg-gray-0 text-blue-800 placeholder:text-blue-800/40",
    "dark:border-gray-200-dark dark:bg-gray-0-dark dark:text-blue-800-dark dark:placeholder:text-blue-800-dark/40",
    "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark"
  );

  const labelClassName =
    "text-sm sm:text-base font-medium leading-5 text-blue-800 dark:text-blue-800-dark";

  return (
    <ServicesQuizStepShell
      className="mx-auto mb-4 max-w-[420px] sm:mb-6"
      title={t("submitYourAnswersTitle")}
    >
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
        <label className="flex flex-col gap-1 sm:gap-3">
          <span className={labelClassName}>{t("yourName")}</span>
          <Input
            value={state.contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder={t("yourNamePlaceholder")}
            className={inputClassName}
            aria-invalid={showErrors && !!errors.contactName}
          />
          {showErrors && errors.contactName ? (
            <FormErrorMessage errors={t(errors.contactName as ValidationKey)} />
          ) : null}
        </label>

        <label className="flex flex-col gap-1 sm:gap-3">
          <span className={labelClassName}>{t("emailAddress")}</span>
          <Input
            type="email"
            value={state.contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t("emailAddressPlaceholder")}
            className={inputClassName}
            aria-invalid={showErrors && !!errors.contactEmail}
          />
          {showErrors && errors.contactEmail ? (
            <FormErrorMessage
              errors={t(errors.contactEmail as ValidationKey)}
            />
          ) : null}
        </label>

        <label className="flex flex-col gap-1 sm:gap-3">
          <span className={labelClassName}>{t("organization")}</span>
          <Input
            value={state.contactOrg}
            onChange={(e) => setContactOrg(e.target.value)}
            placeholder={t("organizationPlaceholder")}
            className={inputClassName}
          />
        </label>

        <div className="flex flex-col gap-1 sm:gap-3">
          <div className={labelClassName}>{t("anyAdditionalComments")}</div>
          <Textarea
            ref={commentsRef}
            value={state.contactComments}
            onChange={(e) => setContactComments(e.target.value)}
            placeholder={t("typeHere")}
            rows={1}
            className={cn(inputClassName, "resize-none overflow-hidden")}
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={cn(
            "w-full rounded-full px-5 py-2 text-base font-medium leading-7 sm:mt-2",
            "bg-blue-900 text-gray-0 hover:bg-blue-900/80 dark:bg-blue-900-dark dark:text-gray-0-dark dark:hover:bg-blue-900-dark/80",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </ServicesQuizStepShell>
  );
};

export default ServicesQuizStep5;
