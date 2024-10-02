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
import { Question, QuestionType } from "@/types/question";

type Props = {
  question: Question;
  isOpen: boolean;
  onClose?: (isOpen: boolean) => void;
};

const schema = z.object({
  resolutionType: z.string(),
  resolutionValue: z.string().optional(),
  actualResolveTime: z
    .string()
    .transform((value) => new Date(value).toISOString()),
});
type FormData = z.infer<typeof schema>;

const QuestionResolutionModal: FC<Props> = ({ isOpen, onClose, question }) => {
  const t = useTranslations();
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentDateTime = useMemo(
    () =>
      format(
        new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000),
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
      ),
    []
  );

  const { handleSubmit, register, watch, reset, formState } = useForm<FormData>(
    {
      resolver: zodResolver(schema),
      defaultValues: {
        resolutionType: "",
        actualResolveTime: currentDateTime,
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
      actualResolveTime,
    }: FormData) => {
      setSubmitErrors([]);

      setIsSubmitting(true);

      const responses = await resolveQuestion(
        question.id,
        resolutionValue || resolutionType,
        actualResolveTime
      );

      setIsSubmitting(false);

      if (responses && "errors" in responses && !!responses.errors) {
        setSubmitErrors(responses.errors);
      } else {
        onClose && onClose(true);
      }
    },
    [onClose, question.id]
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="max-w-xl flex-col items-center text-center">
        <h3 className="mb-4 text-gray-900 dark:text-gray-900-dark">
          {question.title}
        </h3>
        <form
          onSubmit={handleSubmit((formData: FormData) => {
            onSubmit(formData).then();
          })}
          className="flex flex-col items-center gap-4"
        >
          <label className="flex flex-col gap-2">
            What is the resolution?
            <Select
              {...register("resolutionType")}
              options={[
                { value: "", label: "select one", disabled: true },
                ...resolutionTypeOptions,
              ]}
              className="pl-1"
            />
            {question.type === QuestionType.Numeric &&
              resolutionType === "unambiguous" && (
                <Input
                  type="number"
                  step="any"
                  placeholder="numeric resolution"
                  className="max-w-xs bg-transparent"
                  min={question.scaling.range_min!}
                  max={question.scaling.range_max!}
                  {...register("resolutionValue")}
                />
              )}
            {question.type === QuestionType.Date &&
              resolutionType === "unambiguous" && (
                <Input
                  type="datetime-local"
                  placeholder="date resolution"
                  className="bg-transparent pl-1"
                  {...register("resolutionValue")}
                />
              )}
          </label>
          <label className="flex flex-col gap-2">
            Date when resolution was known:
            <Input
              type="datetime-local"
              placeholder="date when resolution was known"
              className="bg-transparent pl-1"
              {...register("actualResolveTime")}
              max={currentDateTime}
            />
          </label>
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={!formState.isValid || !resolutionType || isSubmitting}
            >
              {t("resolve")}
            </Button>
          </div>
          <FormError errors={submitErrors} />
        </form>
      </div>
    </BaseModal>
  );
};

export default QuestionResolutionModal;
