"use client";

import { useTranslations } from "next-intl";
import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const TruncationExample = () => {
  const t = useTranslations();
  return (
    <StyledDisclosure question="Score truncation example">
      <p>
        {t("scores-faq-truncation-example__content_1")}
        <KatexRenderer equation="S" inline />
        {t("scores-faq-truncation-example__content_2")}
      </p>
      <p>
        {t("scores-faq-truncation-example__content_3")}
        <KatexRenderer equation="20\%" inline />
        {t("scores-faq-truncation-example__content_4")}
        <KatexRenderer equation="5\%" inline />
        {t("scores-faq-truncation-example__content_5")}
        <KatexRenderer equation="(p=(20\%+80\% \times 5\%)=24\%" inline />
        {t("scores-faq-truncation-example__content_6")}
        <KatexRenderer equation="5\%" inline />
        {t("scores-faq-truncation-example__content_7")}
      </p>
      <p>
        <b>{t("scores-faq-truncation-example__content_8")}</b>
      </p>
      <p>{t("scores-faq-truncation-example__content_9")}</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="S(24\%) \approx -106" inline />
          {t("scores-faq-truncation-example__content_10")}
          <KatexRenderer equation="20\%" inline />
          {t("scores-faq-truncation-example__content_11")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(24\%) + \frac{51}{52}S(5\%) = -328"
            inline
          />
          {t("scores-faq-truncation-example__content_12")}
          <KatexRenderer equation="80\% \times 5\% = 4\%" inline />
          {t("scores-faq-truncation-example__content_13")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(76\%) + \frac{51}{52}S(95\%) = +92"
            inline
          />
          {t("scores-faq-truncation-example__content_14")}
          <KatexRenderer equation="80\% \times 95\% = 76\%" inline />
          {t("scores-faq-truncation-example__content_15")}
        </li>
      </ul>
      <p>
        {t("scores-faq-truncation-example__content_16")}
        <KatexRenderer
          equation="20\% \times -106 + 4\% \times -327 + 76\% \times +92 = +36"
          inline
        />
        {t("scores-faq-truncation-example__content_17")}
      </p>
      <p>{t("scores-faq-truncation-example__content_18")}</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="S(99\%) \approx +99" inline />
          {t("scores-faq-truncation-example__content_19")}
          <KatexRenderer equation="20\%" inline />
          {t("scores-faq-truncation-example__content_20")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(99\%) + \frac{51}{52}S(5\%) = -324"
            inline
          />
          {t("scores-faq-truncation-example__content_21")}
          <KatexRenderer equation="80\% \times 5\% = 4\%" inline />
          {t("scores-faq-truncation-example__content_22")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(1\%) + \frac{51}{52}S(95\%) = +80"
            inline
          />
          {t("scores-faq-truncation-example__content_23")}
          <KatexRenderer equation="80\% \times 95\% = 76\%" inline />
          {t("scores-faq-truncation-example__content_24")}
        </li>
      </ul>
      <p>
        {t("scores-faq-truncation-example__content_25")}
        <KatexRenderer
          equation="20\% \times +99 + 4\% \times -324 + 76\% \times +80 = +68"
          inline
        />
        {t("scores-faq-truncation-example__content_26")}
      </p>
      <p>
        {t("scores-faq-truncation-example__content_27")}
        <KatexRenderer equation="+68 > +36" inline />
        {t("scores-faq-truncation-example__content_28")}
      </p>
      <p>
        <b>{t("scores-faq-truncation-example__content_29")}</b>
      </p>
      <p>{t("scores-faq-truncation-example__content_30")}</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="\frac{1}{52}S(24\%) \approx −2" inline />
          {t("scores-faq-truncation-example__content_31")}
          <KatexRenderer equation="20\%" inline />
          {t("scores-faq-truncation-example__content_32")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(24\%) + \frac{51}{52}S(5\%) = -328"
            inline
          />
          {t("scores-faq-truncation-example__content_33")}
          <KatexRenderer equation="80\% \times 5\% = 4\%" inline />
          {t("scores-faq-truncation-example__content_34")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(76\%) + \frac{51}{52}S(95\%) = +92"
            inline
          />
          {t("scores-faq-truncation-example__content_35")}
          <KatexRenderer equation="80\% \times 95\% = 76\%" inline />
          {t("scores-faq-truncation-example__content_36")}
        </li>
      </ul>
      <p>
        {t("scores-faq-truncation-example__content_37")}
        <KatexRenderer
          equation="20\% \times -2 + 4\% \times -327 + 76\% \times +92 = +56"
          inline
        />
        {t("scores-faq-truncation-example__content_38")}
      </p>
      <p>{t("scores-faq-truncation-example__content_39")}</p>
      <ul className="ml-5 list-disc">
        <li>
          <KatexRenderer equation="\frac{1}{52}S(99\%) \approx +2" inline />
          {t("scores-faq-truncation-example__content_40")}
          <KatexRenderer equation="20\%" inline />
          {t("scores-faq-truncation-example__content_41")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(99\%) + \frac{51}{52}S(5\%) = -324"
            inline
          />
          {t("scores-faq-truncation-example__content_42")}
          <KatexRenderer equation="80\% \times 5\% = 4\%" inline />
          {t("scores-faq-truncation-example__content_43")}
        </li>
        <li>
          <KatexRenderer
            equation="\frac{1}{52}S(1\%) + \frac{51}{52}S(95\%) = +80"
            inline
          />
          {t("scores-faq-truncation-example__content_44")}
          <KatexRenderer equation="80\% \times 95\% = 76\%" inline />
          {t("scores-faq-truncation-example__content_45")}
        </li>
      </ul>
      <p>
        {t("scores-faq-truncation-example__content_46")}
        <KatexRenderer
          equation="20\% \times +2 + 4\% \times -324 + 76\% \times +80 = +48"
          inline
        />
        {t("scores-faq-truncation-example__content_47")}
      </p>
      <p>
        {t("scores-faq-truncation-example__content_48")}
        <KatexRenderer equation="+56 > +48" inline />
        {t("scores-faq-truncation-example__content_49")}
      </p>
    </StyledDisclosure>
  );
};

export default TruncationExample;
