"use client";

import { useTranslations } from "next-intl";
import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const BaselineMath = () => {
  const t = useTranslations();
  return (
    <StyledDisclosure question="Baseline score math">
      <p>
        {t("scores-faq-baseline-math__content_1")}
        <a href="/help/scores-faq/#log-score">
          {t("scores-faq-baseline-math__content_2")}
        </a>
        {t("scores-faq-baseline-math__content_3")}
      </p>
      <KatexRenderer
        equation="\text{Baseline score} = 100 \times
            \frac{
            \operatorname{log\ score}(prediction) - \operatorname{log\ score}(baseline)
            }{
            \text{scale}
            }"
        inline={false}
      />
      <p>
        {t("scores-faq-baseline-math__content_4")}
        <KatexRenderer equation="scale" inline />
        {t("scores-faq-baseline-math__content_5")}
        <KatexRenderer equation="P(outcome) = 100 \%" inline />
        {t("scores-faq-baseline-math__content_6")}
      </p>
      <KatexRenderer
        equation="\text{binary Baseline score} = 100 \times \frac{ \ln(P(outcome)) - \ln(50 \%) }{ \ln(2)}"
        inline={false}
      />
      <p>
        {t("scores-faq-baseline-math__content_7")}
        <KatexRenderer equation="100 \times(\log_2(P(outcome)) + 1)" inline />.
      </p>
      <p>{t("scores-faq-baseline-math__content_8")}</p>
      <KatexRenderer
        equation="\text{multiple choice Baseline score} = 100 \times \frac{ \ln(P(outcome)) - \ln(\frac{ 1}{ N}) }{ \ln(N)}"
        inline={false}
      />
      <p>
        {t("scores-faq-baseline-math__content_9")}
        <KatexRenderer equation="scale" inline />
        {t("scores-faq-baseline-math__content_10")}
      </p>
      <KatexRenderer
        equation="\text{continuous Baseline score} = 100 \times \frac{ \ln(\operatorname{pdf}(outcome)) - \ln(baseline) }{ 2 }"
        inline={false}
      />
      <p>
        {t("scores-faq-baseline-math__content_11")}
        <KatexRenderer equation="\ln" inline />
        {t("scores-faq-baseline-math__content_12")}
        <KatexRenderer equation="P(outcome)" inline />
        {t("scores-faq-baseline-math__content_13")}
        <KatexRenderer equation="\operatorname{pdf}(outcome)" inline />
        {t("scores-faq-baseline-math__content_14")}
      </p>
      <p>
        {t("scores-faq-baseline-math__content_15")}
        <KatexRenderer equation="baseline" inline />
        {t("scores-faq-baseline-math__content_16")}
      </p>
      <ul className="list-disc pl-5">
        <li>
          {t("scores-faq-baseline-math__content_17")}
          <KatexRenderer equation="baseline" inline />
          {t("scores-faq-baseline-math__content_18")}
        </li>
        <li>
          {t("scores-faq-baseline-math__content_19")}
          <KatexRenderer equation="baseline" inline />
          {t("scores-faq-baseline-math__content_20")}
        </li>
        <li>
          {t("scores-faq-baseline-math__content_21")}
          <KatexRenderer equation="baseline" inline />
          {t("scores-faq-baseline-math__content_22")}
        </li>
      </ul>
    </StyledDisclosure>
  );
};

export default BaselineMath;
