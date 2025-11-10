"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { FormError } from "@/components/ui/form_field";
import { PostWithForecasts } from "@/types/post";
import { isDriverDraft } from "@/utils/key_factors";

import KeyFactorsDriverAdditionForm from "../item_creation/driver/key_factors_driver_addition_form";
import { useKeyFactorsCtx } from "../key_factors_context";
import KeyFactorsAddInCommentWrapper from "./key_factors_add_in_comment_wrapper";
import { driverTextSchema } from "../schemas";

type Props = {
  postData: PostWithForecasts;
  onSubmit: () => void;
  onCancel: () => void;
};

const KeyFactorsAddInCommentDriver: React.FC<Props> = ({
  postData,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslations();
  const {
    errors: keyFactorsErrors,
    suggestedKeyFactors,
    drafts,
  } = useKeyFactorsCtx();

  const driverDrafts = useMemo(() => drafts.filter(isDriverDraft), [drafts]);
  return (
    <KeyFactorsAddInCommentWrapper
      onSubmit={onSubmit}
      onCancel={onCancel}
      disableSubmit={
        (driverDrafts.every((d) => d.driver.text.trim() === "") &&
          suggestedKeyFactors.length === 0) ||
        driverDrafts.some(
          (d) => !driverTextSchema.safeParse(d.driver.text).success
        ) ||
        driverDrafts.some(
          (d) =>
            d.driver.text.trim() !== "" &&
            d.driver.impact_direction === null &&
            d.driver.certainty !== -1
        )
      }
    >
      <KeyFactorsDriverAdditionForm post={postData} />
      <p className="m-0">{t("addDriverCommentDisclaimer")}</p>
      <FormError errors={keyFactorsErrors} />
    </KeyFactorsAddInCommentWrapper>
  );
};

export default KeyFactorsAddInCommentDriver;
