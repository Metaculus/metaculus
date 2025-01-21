"use client";

import { useTranslations } from "next-intl";
import React from "react";

import StyledDisclosure from "../../../components/styled_disclosure";

const FurtherMath = () => {
  const t = useTranslations();
  return (
    <StyledDisclosure question="Further math details for nerds">
      <p>{t("scores-faq-further-math__content_1")}</p>
      <p></p>
      <p>{t("scores-faq-further-math__content_2")}</p>
    </StyledDisclosure>
  );
};

export default FurtherMath;
