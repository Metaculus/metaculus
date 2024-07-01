"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { resolveQuestion } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import Select from "@/components/ui/select";
import { ErrorResponse } from "@/types/fetch";
import { Question } from "@/types/question";

type Props = {
  question: Question;
  isOpen: boolean;
  onClose?: (isOpen: boolean) => void;
};

const schema = z.object({
  resolutionType: z.string(),
  resolutionValue: z.string().optional(),
  resolutionKnownAt: z
    .string()
    .transform((value) => new Date(value).toISOString()),
});
type FormData = z.infer<typeof schema>;

const QuestionResolutionModal: FC<Props> = ({ isOpen, onClose, question }) => {
  const t = useTranslations();
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentDateTime = useMemo(
    () => format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    []
  );

  const { handleSubmit, register, watch, reset, formState } = useForm<FormData>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        resolutionType: "",
        resolutionKnownAt: currentDateTime,
      },
    }
  );

  const resolutionType = watch("resolutionType");
  const resolutionTypeOptions = useMemo(() => {
    const baseQuestionOptions = [
      { value: "ambiguous", label: "Ambiguous" },
      { value: "annulled", label: "Annulled" },
    ];

    if (["date", "numeric"].includes(question.type)) {
      return [
        { value: "unambiguous", label: "Unambiguous" },
        ...baseQuestionOptions,
      ];
    }

    if (question.type === "binary") {
      return [
        { value: "yes", label: "yes" },
        { value: "no", label: "no" },
        ...baseQuestionOptions,
      ];
    }

    return [
      ...(question.options?.map((option) => ({
        value: option,
        label: option,
      })) || []),
      ...baseQuestionOptions,
    ];
  }, [question.options, question.type]);

  const onSubmit = useCallback(
    async ({
      resolutionType,
      resolutionValue,
      resolutionKnownAt,
    }: FormData) => {
      setSubmitErrors([]);

      setIsSubmitting(true);

      const responses = await resolveQuestion(
        question.id,
        resolutionValue || resolutionType,
        resolutionKnownAt
      );

      setIsSubmitting(false);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
      }
    },
    [question.id]
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="dark">
      <div className="max-w-xl flex-col items-center text-center">
        <h3 className="mb-4 text-white">{question.title}</h3>
        <p className="mb-3">What is the resolution?</p>
        <form
          onSubmit={handleSubmit((formData: FormData) => {
            onSubmit(formData).then();
          })}
          className="flex flex-col gap-y-2"
        >
          <div>
            <Select
              {...register("resolutionType")}
              options={[
                { value: "", label: "select one", disabled: true },
                ...resolutionTypeOptions,
              ]}
            />
          </div>
          {question.type === "numeric" && resolutionType == "unambiguous" && (
            <div className="mt-2">
              <Input
                type="number"
                placeholder="numeric resolution"
                className="min-w-40 !rounded-none border-gray-600-dark bg-transparent"
                min={question.min}
                max={question.max}
                {...register("resolutionValue")}
              />
            </div>
          )}
          <div>
            <p>Date when resolution was known:</p>
            <Input
              type="datetime-local"
              placeholder="date when resolution was known"
              className="!rounded-none border-gray-600-dark bg-transparent pl-1"
              {...register("resolutionKnownAt")}
              max={currentDateTime}
            />
          </div>
          <FormError errors={submitErrors} />
          <p className="m-0">
            Notifications will be sent in 10 minutes (at Jun 27, 2024, 8:32 PM).
            If this question is unresolved before then, no notification will be
            sent.
          </p>
          <div>
            <Button
              variant="bright"
              type="submit"
              size="lg"
              disabled={!formState.isValid || !resolutionType || isSubmitting}
            >
              {t("resolveButton")}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
};

export default QuestionResolutionModal;
