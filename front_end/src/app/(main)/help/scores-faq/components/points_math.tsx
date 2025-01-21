"use client";

import { useTranslations } from "next-intl";
import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const PointsMath = () => {
  const t = useTranslations();
  return (
    <StyledDisclosure question="Metaculus points math">
      <p>
        {t("scores-faq-points-math__content_1")}
        <KatexRenderer equation="S(T,o)" inline />
        {t("scores-faq-points-math__content_2")}
        <KatexRenderer equation="T" inline />
        {t("scores-faq-points-math__content_3")}
      </p>
      <KatexRenderer
        equation="S(T,o) = a(N) \times L(p,o) + b(N) \times B(p,o)"
        inline={false}
      />
      <p>{t("scores-faq-points-math__content_4")}</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="o" inline />
          {t("scores-faq-points-math__content_5")}
        </li>
        <li>
          <KatexRenderer equation="N" inline />
          {t("scores-faq-points-math__content_6")}
        </li>
        <li>
          <KatexRenderer equation="L(p,o)" inline />
          {t("scores-faq-points-math__content_7")}
        </li>
      </ul>
      <KatexRenderer
        equation="L(p, o) =
  \begin{cases}
  \log_2 \left ( \frac{p}{0.5} \right ) & \text{if } o = 1 \\
  \log_2 \left ( \frac{1 - p}{0.5} \right ) & \text{if } o = 0
  \end{cases}"
        inline={false}
      />
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="B(p,o)" inline />
          {t("scores-faq-points-math__content_8")}
          <a href="https://en.wikipedia.org/wiki/Beta_distribution">
            {t("scores-faq-points-math__content_9")}
          </a>
          ).
        </li>
        <li>
          <KatexRenderer equation="a(N)" inline />
          {t("scores-faq-points-math__content_10")}
          <KatexRenderer equation="b(N)" inline />
          {t("scores-faq-points-math__content_11")}
          <KatexRenderer equation="N" inline />
          {t("scores-faq-points-math__content_12")}
        </li>
      </ul>
      <KatexRenderer
        equation="\begin{align*}
  A(N) &= 45 + 15 \log_2(1 + N/30) \\
  B(N) &= 30 \log_2(1 + N/30)
  \end{align*}"
        inline={false}
      />
      <p>
        {t("scores-faq-points-math__content_13")}
        <KatexRenderer equation="B" inline />,{" "}
        <KatexRenderer equation="N" inline />
        {t("scores-faq-points-math__content_14")}
        <KatexRenderer equation="p" inline />
        {t("scores-faq-points-math__content_15")}
        <KatexRenderer equation="T" inline />
        {t("scores-faq-points-math__content_16")}
        <KatexRenderer equation="S(T, o)" inline />.
      </p>
      <p>
        {t("scores-faq-points-math__content_17")}
        <KatexRenderer equation="S(T, o)" inline />
        {t("scores-faq-points-math__content_18")}
        <KatexRenderer equation="T" inline />:
      </p>
      <KatexRenderer
        equation="S = \frac{1}{t_c-t_o} \int_{t_o}^{t_c} S(T, o) \, dT"
        inline={false}
      />
      <p>
        {t("scores-faq-points-math__content_19")}
        <KatexRenderer equation="t_o" inline />
        {t("scores-faq-points-math__content_20")}
        <KatexRenderer equation="t_c" inline />
        {t("scores-faq-points-math__content_21")}
        <KatexRenderer equation="S(T) = 0" inline />
        {t("scores-faq-points-math__content_22")}
      </p>
      <p>{t("scores-faq-points-math__content_23")}</p>
    </StyledDisclosure>
  );
};

export default PointsMath;
