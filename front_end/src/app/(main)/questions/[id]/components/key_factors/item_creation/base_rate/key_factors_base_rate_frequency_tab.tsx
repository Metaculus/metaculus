"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { FormError, Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { BaseRateDraft } from "@/types/key_factors";
import cn from "@/utils/core/cn";

type Props = {
  draft: BaseRateDraft;
  setDraft: (d: BaseRateDraft) => void;
  effectiveUnit?: string;
  labelClassName: string;
  inputClassName: string;
  showErrors?: boolean;
  errors?: Record<string, string | undefined>;
};

const KeyFactorsBaseRateFrequencyTab: FC<Props> = ({
  draft,
  setDraft,
  effectiveUnit,
  labelClassName,
  inputClassName,
  showErrors = false,
  errors,
}) => {
  const t = useTranslations();
  const br = draft.base_rate;
  const maybeErrors = showErrors ? errors : undefined;

  return (
    <div className="flex flex-col gap-4">
      <InputContainer
        labelText={t("referenceClass")}
        labelClassName={labelClassName}
      >
        <Input
          aria-invalid={!!maybeErrors?.reference_class}
          name="reference_class"
          value={br.reference_class ?? ""}
          placeholder={t("referenceClassPlaceholderFrequency")}
          onChange={(e) =>
            setDraft({
              ...draft,
              base_rate: { ...br, reference_class: e.target.value },
            })
          }
          className={inputClassName}
          errors={maybeErrors}
          errorClassName="normal-case"
        />
      </InputContainer>

      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 basis-0 flex-col gap-1">
          <InputContainer
            labelText={t("rate")}
            className="w-full flex-1"
            isNativeFormControl={false}
            labelClassName={labelClassName}
          >
            <div className="flex min-w-0 max-w-full items-center gap-[10px]">
              <Input
                aria-invalid={!!maybeErrors?.rate}
                name="rate_numerator"
                type="number"
                value={br.rate_numerator ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    base_rate: {
                      ...br,
                      rate_numerator:
                        e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="1"
                className={cn("min-w-0 flex-1", inputClassName)}
              />
              <span className="text-sm text-gray-700 dark:text-gray-700-dark">
                in
              </span>
              <Input
                aria-invalid={!!maybeErrors?.rate}
                name="rate_denominator"
                type="number"
                value={br.rate_denominator ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    base_rate: {
                      ...br,
                      rate_denominator:
                        e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
                placeholder="10"
                className={cn("min-w-0 flex-1", inputClassName)}
              />
            </div>
          </InputContainer>
          <FormError name="rate" errors={maybeErrors} className="normal-case" />
        </div>

        <InputContainer
          labelClassName={labelClassName}
          labelText={t("unit")}
          className="min-w-0 flex-1 basis-0"
        >
          <Input
            aria-invalid={!!maybeErrors?.unit}
            name="unit"
            value={br.unit ?? effectiveUnit ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, base_rate: { ...br, unit: e.target.value } })
            }
            className={cn("w-full", inputClassName)}
            placeholder={t("days")}
            errors={maybeErrors}
            errorClassName="normal-case"
          />
        </InputContainer>
      </div>

      <InputContainer labelClassName={labelClassName} labelText={t("source")}>
        <Input
          aria-invalid={!!maybeErrors?.source}
          name="source"
          value={br.source ?? ""}
          placeholder={t("sourcePlaceholderFrequency")}
          onChange={(e) =>
            setDraft({ ...draft, base_rate: { ...br, source: e.target.value } })
          }
          className={inputClassName}
          errors={maybeErrors}
          errorClassName="normal-case"
        />
      </InputContainer>
    </div>
  );
};

export default KeyFactorsBaseRateFrequencyTab;
