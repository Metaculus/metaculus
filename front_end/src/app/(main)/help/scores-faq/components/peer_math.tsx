"use client";
import { useTranslations } from "next-intl";
import React from "react";

import KatexRenderer from "@/components/katex_renderer";

import StyledDisclosure from "../../../components/styled_disclosure";

const PeerMath = () => {
  const t = useTranslations();
  return (
    <StyledDisclosure question="Peer score math">
      <p>
        {t("scores-faq-peer-math__content_1")}
        <a href="/help/scores-faq/#log-score">
          {t("scores-faq-peer-math__content_2")}
        </a>
        {t("scores-faq-peer-math__content_3")}
      </p>
      <KatexRenderer
        equation="\text{Peer score} = 100 \times \frac{1}{N} \sum_{i = 1}^N \operatorname{log\ score}(p) - \operatorname{log\ score}(p_i)"
        inline={false}
      />
      <p>
        {t("scores-faq-peer-math__content_4")}
        <KatexRenderer equation="p" inline />
        {t("scores-faq-peer-math__content_5")}
        <KatexRenderer equation="N" inline />
        {t("scores-faq-peer-math__content_6")}
        <KatexRenderer equation="p_i" inline />
        {t("scores-faq-peer-math__content_7")}
      </p>
      <p>{t("scores-faq-peer-math__content_8")}</p>
      <KatexRenderer
        equation="\text{Peer score} = 100 \times (\ln(p) - \ln(\operatorname{GM}(p_i)))"
        inline={false}
      />
      <p>
        {t("scores-faq-peer-math__content_9")}
        <a href="https://en.wikipedia.org/wiki/Geometric_mean">
          <KatexRenderer equation="\operatorname{GM}(p_i)" inline />
        </a>
        {t("scores-faq-peer-math__content_10")}
      </p>
      <p>
        {t("scores-faq-peer-math__content_11")}
        <KatexRenderer equation="p" inline />
        {t("scores-faq-peer-math__content_12")}
      </p>
    </StyledDisclosure>
  );
};

export default PeerMath;
