"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { Input, FormError } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { BaseRateDraft } from "@/types/key_factors";
import cn from "@/utils/core/cn";

import { baseRateFrequencySchema } from "../../schemas";

type Props = {
  draft: BaseRateDraft;
  setDraft: (d: BaseRateDraft) => void;
  effectiveUnit?: string;
  labelClassName: string;
  inputClassName: string;
  showErrors?: boolean;
};

type Errs = Record<string, string | undefined>;

const KeyFactorsBaseRateFrequencyTab: FC<Props> = ({
  draft,
  setDraft,
  effectiveUnit,
  labelClassName,
  inputClassName,
  showErrors = false,
}) => {
  const t = useTranslations();
  const br = draft.base_rate;

  const fieldErrors: Errs = useMemo(() => {
    if (br.type !== "frequency") return {};

    const zodInput = {
      type: "frequency" as const,
      reference_class: br.reference_class ?? "",
      rate_numerator: br.rate_numerator ?? ("" as unknown as number),
      rate_denominator: br.rate_denominator ?? ("" as unknown as number),
      unit: br.unit ?? "",
      extrapolation: br.extrapolation ?? "",
      based_on: br.based_on ?? "",
      source: br.source ?? "",
    };

    const r = baseRateFrequencySchema.safeParse(zodInput);
    if (r.success) return {};

    const errs: Errs = {};
    const msg = {
      refRequired: t("referenceClassRequired"),
      rateRequired: t("rateRequired"),
      unitRequired: t("unitRequired"),
      sourceRequired: t("sourceRequired"),
    };

    const asString = (v: unknown) => `${v ?? ""}`.trim();
    if (!asString(zodInput.reference_class))
      errs.reference_class = msg.refRequired;
    if (!asString(zodInput.unit)) errs.unit = msg.unitRequired;
    if (!asString(zodInput.source)) errs.source = msg.sourceRequired;

    const rateIssues = r.error.issues.filter((i) =>
      ["rate_numerator", "rate_denominator"].includes(`${i.path[0]}`)
    );
    if (
      zodInput.rate_numerator === ("" as unknown as number) ||
      zodInput.rate_denominator === ("" as unknown as number) ||
      rateIssues.length > 0
    ) {
      const cross = r.error.issues.find((i) => i.message.includes("≤"));
      errs.rate = cross?.message ?? msg.rateRequired;
    }

    return errs;
  }, [br, t]);

  const maybeErrors = showErrors ? fieldErrors : undefined;

  return (
    <div className="flex flex-col gap-4">
      <InputContainer
        labelText={t("referenceClass")}
        labelClassName={labelClassName}
      >
        <Input
          aria-invalid={!!maybeErrors?.reference_class}
          data-first-error={maybeErrors?.reference_class ? "true" : undefined}
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
        <div className="flex flex-col gap-1">
          <InputContainer
            labelText={t("rate")}
            className="flex-1"
            isNativeFormControl={false}
            labelClassName={labelClassName}
          >
            <div className="flex items-center gap-[10px]">
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
                className={cn("w-[96px]", inputClassName)}
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
                className={cn("w-[96px]", inputClassName)}
              />
            </div>
          </InputContainer>
          <FormError name="rate" errors={maybeErrors} className="normal-case" />
        </div>

        <InputContainer
          labelClassName={labelClassName}
          labelText={t("unit")}
          className="flex-1"
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
