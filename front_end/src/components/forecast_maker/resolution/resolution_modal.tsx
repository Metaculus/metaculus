"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { resolveQuestion } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import ButtonGroup from "@/components/ui/button_group";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { FormError, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Select from "@/components/ui/select";
import {
  AMBIGUOUS_RESOLUTION,
  ANNULLED_RESOLUTION,
} from "@/constants/questions";
import { ErrorResponse } from "@/types/fetch";
import { Question, QuestionType } from "@/types/question";
import { getAllOptionsHistory } from "@/utils/questions/helpers";

type Props = {
  question: Question;
  isOpen: boolean;
  onClose?: (isOpen: boolean) => void;
};

const schema = z.object({
  resolutionType: z.string(),
  unambiguousType: z.string().optional(),
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
    () => format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    []
  );
  const { open_lower_bound, open_upper_bound } = question;

  const resolutionTypeOptions = useMemo(() => {
    const baseQuestionOptions = [
      { value: AMBIGUOUS_RESOLUTION, label: "Ambiguous" },
      { value: ANNULLED_RESOLUTION, label: "Annulled" },
    ];

    if (
      [QuestionType.Numeric, QuestionType.Date, QuestionType.Discrete].includes(
        question.type
      )
    ) {
      return [
        ...baseQuestionOptions,
        { value: "unambiguous", label: "Unambiguous" },
      ];
    }

    if (question.type === QuestionType.Binary) {
      return [
        ...baseQuestionOptions,
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ];
    }

    return [
      ...(getAllOptionsHistory(question).map((option) => ({
        value: option,
        label: option,
      })) || []),
      ...baseQuestionOptions,
    ];
  }, [question.options, question.type]);

  const { handleSubmit, register, watch, setValue, formState } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        resolutionType:
          question.type === QuestionType.MultipleChoice
            ? resolutionTypeOptions[0]?.value ?? ""
            : "",
        actualResolveTime: currentDateTime,
      },
    });

  const resolutionType = watch("resolutionType");
  const unambiguousType = watch("unambiguousType");

  const unambiguousOptions = useMemo(() => {
    const options = [{ value: "knownValue", label: "Known value" }];
    if (open_lower_bound) {
      options.unshift({ value: "below_lower_bound", label: "Unknown < range" });
    }

    if (open_upper_bound) {
      options.push({
        value: "above_upper_bound",
        label: "Unknown > range",
      });
    }
    return options;
  }, [open_lower_bound, open_upper_bound]);

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
        onClose?.(true);
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
          <label className="flex flex-col gap-2">What is the resolution?</label>
          {question.type === QuestionType.MultipleChoice ? (
            // We want to render Select input for multiple choice questions
            // To fit all choices on the screen
            <Select
              value={resolutionType}
              options={resolutionTypeOptions}
              onChange={(event) => {
                setValue("resolutionType", event.target.value);
                setValue("resolutionValue", undefined);
              }}
            />
          ) : (
            <ButtonGroup
              value={resolutionType}
              buttons={resolutionTypeOptions}
              onChange={(value) => {
                setValue("resolutionType", value);
                setValue("resolutionValue", undefined);
              }}
              variant="tertiary"
            />
          )}
          {resolutionType === "unambiguous" && (
            <ButtonGroup
              value={unambiguousType ?? ""}
              buttons={unambiguousOptions}
              onChange={(value) => {
                setValue("unambiguousType", value);
                value !== "knownValue"
                  ? setValue("resolutionValue", value)
                  : setValue("resolutionValue", undefined);
              }}
              variant="tertiary"
            />
          )}
          {question.type === QuestionType.Numeric &&
            resolutionType === "unambiguous" &&
            unambiguousType === "knownValue" && (
              <Input
                type="number"
                step="any"
                placeholder="numeric resolution"
                className="max-w-xs bg-transparent"
                min={
                  open_lower_bound
                    ? undefined
                    : question?.scaling.range_min ?? undefined
                }
                max={
                  open_upper_bound
                    ? undefined
                    : question?.scaling.range_max ?? undefined
                }
                {...register("resolutionValue")}
              />
            )}
          {/* TODO: this logic doesn't allow choosing known values outside of bounds */}
          {question.type === QuestionType.Discrete &&
            resolutionType === "unambiguous" &&
            unambiguousType === "knownValue" && (
              <Input
                type="number"
                step={
                  !isNil(question?.scaling.range_max) &&
                  !isNil(question.scaling.range_min) &&
                  !isNil(question.inbound_outcome_count)
                    ? Math.round(
                        1e10 *
                          ((question.scaling.range_max -
                            question.scaling.range_min) /
                            question.inbound_outcome_count)
                      ) / 1e10
                    : "any"
                }
                placeholder="numeric resolution"
                className="max-w-xs bg-transparent"
                min={
                  !isNil(question?.scaling.range_max) &&
                  !isNil(question.scaling.range_min) &&
                  !isNil(question.inbound_outcome_count)
                    ? Math.round(
                        1e10 *
                          (question.scaling.range_min +
                            0.5 *
                              ((question.scaling.range_max -
                                question.scaling.range_min) /
                                question.inbound_outcome_count))
                      ) / 1e10
                    : undefined
                }
                max={question?.scaling.range_max ?? undefined}
                {...register("resolutionValue")}
              />
            )}
          {question.type === QuestionType.Date &&
            resolutionType === "unambiguous" &&
            unambiguousType === "knownValue" && (
              <DatetimeUtc
                placeholder="date resolution"
                className="bg-transparent pl-1"
                defaultValue={watch("resolutionValue")}
                onChange={(val) => setValue("resolutionValue", val)}
              />
            )}
          <label className="flex flex-col gap-2">
            Date when resolution was known:
            <DatetimeUtc
              placeholder="date when resolution was known"
              className="bg-transparent pl-1"
              max={currentDateTime}
              defaultValue={watch("actualResolveTime")}
              onChange={(val) =>
                setValue("actualResolveTime", val ?? currentDateTime)
              }
            />
          </label>
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={!formState.isValid || !resolutionType || isSubmitting}
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : t("resolve")}
            </Button>
          </div>
          <FormError errors={submitErrors} />
        </form>
      </div>
    </BaseModal>
  );
};

export default QuestionResolutionModal;
