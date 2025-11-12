"use client";

import { Radio, RadioGroup } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { FormError, Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import RadioButton from "@/components/ui/radio_button";
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

const KeyFactorsBaseRateTrendTab: FC<Props> = ({
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

  const errorBag = showErrors ? errors : undefined;

  return (
    <div className="flex flex-col gap-3">
      <InputContainer
        labelText={t("referenceClass")}
        labelClassName={labelClassName}
      >
        <Input
          name="reference_class"
          value={br.reference_class ?? ""}
          placeholder={t("referenceClassPlaceholderTrend")}
          onChange={(e) =>
            setDraft({
              ...draft,
              base_rate: { ...br, reference_class: e.target.value },
            })
          }
          className={inputClassName}
          errors={errorBag}
          errorClassName="normal-case"
        />
      </InputContainer>

      <p className="my-0 text-base text-blue-700 dark:text-blue-700-dark">
        {t("ifTrendContinuesHelper")}
      </p>

      <div className="flex gap-4">
        <InputContainer
          labelText={t("projectedValue")}
          className="flex-1"
          labelClassName={labelClassName}
        >
          <Input
            name="projected_value"
            type="number"
            value={br.projected_value ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                base_rate: {
                  ...br,
                  projected_value:
                    e.target.value === "" ? null : Number(e.target.value),
                },
              })
            }
            placeholder="42"
            className={cn(inputClassName, "w-full")}
            errors={errorBag}
            errorClassName="normal-case"
          />
        </InputContainer>

        <InputContainer
          labelClassName={labelClassName}
          labelText={t("unit")}
          className="flex-1"
        >
          <Input
            name="unit"
            value={br.unit ?? effectiveUnit ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, base_rate: { ...br, unit: e.target.value } })
            }
            className={cn(inputClassName, "w-full")}
            placeholder="%"
            errors={errorBag}
            errorClassName="normal-case"
          />
        </InputContainer>

        <InputContainer
          labelClassName={labelClassName}
          labelText={t("by")}
          className="flex-1"
        >
          <Input
            name="projected_by_year"
            type="number"
            value={br.projected_by_year ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                base_rate: {
                  ...br,
                  projected_by_year:
                    e.target.value === "" ? null : Number(e.target.value),
                },
              })
            }
            placeholder="2029"
            className={cn(inputClassName, "w-full")}
            errors={errorBag}
            errorClassName="normal-case"
          />
        </InputContainer>
      </div>

      <InputContainer
        labelText={t("extrapolation")}
        className="flex-1"
        isNativeFormControl={false}
        labelClassName={labelClassName}
      >
        <RadioGroup
          value={br.extrapolation ?? ""}
          onChange={(v: "linear" | "exponential" | "other") =>
            setDraft({ ...draft, base_rate: { ...br, extrapolation: v } })
          }
          as="ul"
          className="flex flex-wrap gap-4"
        >
          {[
            { value: "linear" as const, label: "Linear" },
            { value: "exponential" as const, label: "Exponential" },
            { value: "other" as const, label: t("other") },
          ].map((opt) => (
            <Radio key={opt.value} value={opt.value} as="li">
              <RadioButton checked={(br.extrapolation ?? "") === opt.value}>
                {opt.label}
              </RadioButton>
            </Radio>
          ))}
        </RadioGroup>

        <FormError
          name="extrapolation"
          errors={errorBag}
          className="normal-case"
        />
      </InputContainer>

      <InputContainer
        labelClassName={labelClassName}
        labelText={t("basedOnOptional")}
      >
        <Input
          name="based_on"
          value={br.based_on ?? ""}
          placeholder={t("basedOnPlaceholder")}
          onChange={(e) =>
            setDraft({
              ...draft,
              base_rate: { ...br, based_on: e.target.value },
            })
          }
          className={inputClassName}
        />
      </InputContainer>

      <InputContainer labelClassName={labelClassName} labelText={t("source")}>
        <Input
          name="source"
          value={br.source ?? ""}
          placeholder={t("sourcePlaceholderTrend")}
          onChange={(e) =>
            setDraft({ ...draft, base_rate: { ...br, source: e.target.value } })
          }
          className={inputClassName}
          errors={errorBag}
          errorClassName="normal-case"
        />
      </InputContainer>
    </div>
  );
};

export default KeyFactorsBaseRateTrendTab;
