"use client";

import { faSquarePollVertical } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import { Tabs, TabsList, TabsSection, TabsTab } from "@/components/ui/tabs";
import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorsBaseRateFrequencyTab from "./key_factors_base_rate_frequency_tab";
import KeyFactorsBaseRateTrendTab from "./key_factors_base_rate_trend_tab";
import { getEffectiveUnit, switchBaseType } from "./utils";
import useBaseRateValidation from "../../hooks/use_base_rate_validation";
import OptionTargetPicker from "../driver/option_target_picker";
import KeyFactorsNewItemContainer from "../key_factors_new_item_container";

type Props = {
  draft: BaseRateDraft;
  setDraft: (d: BaseRateDraft) => void;
  post: PostWithForecasts;
  showErrorsSignal?: number;
  onValidate?: (valid: boolean) => void;
  onBack?: () => void;
};

const KeyFactorsBaseRateForm: FC<Props> = ({
  draft,
  setDraft,
  post,
  showErrorsSignal = 0,
  onValidate,
  onBack,
}) => {
  const t = useTranslations();
  const [showLocalErrors, setShowLocalErrors] = useState(false);

  const effectiveUnit = useMemo(
    () => getEffectiveUnit(post, draft),
    [post, draft]
  );

  const { errors, isValid } = useBaseRateValidation(draft);

  useEffect(() => {
    if (showErrorsSignal > 0) {
      setShowLocalErrors(true);
      onValidate?.(isValid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showErrorsSignal]);

  const onTabChange = (v: string) => {
    setShowLocalErrors(false);
    setDraft(switchBaseType(draft, v as "frequency" | "trend", effectiveUnit));
  };

  const labelClassName =
    "text-xs font-medium text-blue-700 dark:text-blue-700-dark";
  const inputClassName =
    "rounded-[4px] h-10 border border-blue-500 px-3 py-2 text-base font-normal text-blue-800 placeholder-blue-700 placeholder-opacity-50 dark:border-blue-500-dark dark:text-blue-800-dark dark:placeholder-blue-700-dark bg-transparent";

  const tabDefs = [
    { value: "frequency" as const, label: t("frequency") },
    { value: "trend" as const, label: t("trend") },
  ];

  const commonProps = {
    draft,
    setDraft,
    effectiveUnit,
    labelClassName,
    inputClassName,
    showErrors: showLocalErrors,
    errors,
  };

  return (
    <KeyFactorsNewItemContainer
      icon={faSquarePollVertical}
      label={t("baseRate")}
      onBack={onBack}
    >
      <div className="flex flex-col gap-3 antialiased">
        <p className={cn("my-0 -mb-[14px]", labelClassName)}>
          {t("valueType")}
        </p>

        <Tabs
          defaultValue={draft.base_rate.type}
          value={draft.base_rate.type}
          onChange={onTabChange}
          className="bg-transparent dark:bg-transparent"
        >
          <TabsList className="static bg-transparent pb-0 dark:bg-transparent">
            {tabDefs.map((tab) => (
              <TabsTab
                key={tab.value}
                value={tab.value}
                scrollOnSelect={false}
                dynamicClassName={(isActive) =>
                  `py-2 !px-3 !text-[14px] flex items-center font-medium h-8 leading-[16px] ${
                    isActive
                      ? ""
                      : "text-blue-700 dark:text-blue-700-dark bg-gray-0 dark:bg-gray-0-dark border border-blue-400 dark:border-blue-400-dark"
                  }`
                }
              >
                {tab.label}
              </TabsTab>
            ))}
          </TabsList>

          <TabsSection value="frequency">
            <KeyFactorsBaseRateFrequencyTab {...commonProps} />
          </TabsSection>

          <TabsSection value="trend">
            <KeyFactorsBaseRateTrendTab {...commonProps} />
          </TabsSection>
        </Tabs>

        <OptionTargetPicker
          post={post}
          value={{
            question_id: draft.question_id,
            question_option: draft.question_option,
          }}
          onChange={(tgt) =>
            setDraft({
              base_rate: draft.base_rate,
              question_id: tgt.question_id,
              question_option: tgt.question_option,
            })
          }
        />
      </div>
    </KeyFactorsNewItemContainer>
  );
};

export default KeyFactorsBaseRateForm;
