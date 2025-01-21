import { useTranslations } from "next-intl";

import KatexRenderer from "@/components/katex_renderer";

import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Medals FAQ | Metaculus",
  description:
    "Learn about Metaculus medals, how they are awarded for forecasting accuracy, comment quality, and question writing. Understand the h-index, medal tiers, and eligibility criteria.",
};

export default function MedalsFAQ() {
  const t = useTranslations();
  return (
    <PageWrapper>
      <h1>{t("medals-faq_MedalsFAQ")}</h1>
      <p>
        {t("medals-faq__content_1")}
        <a href="/faq/">{t("medals-faq__content_2")}</a>
        {t("medals-faq__content_3")}
        <a href="/help/medals-faq/">{t("medals-faq__content_4")}</a>.
      </p>

      <div className="table-of-contents">
        <ul className="space-y-1">
          <li>
            <a href="#metaculus-medals">{t("medals-faq__content_5")}</a>
          </li>
          <li>
            <a href="#baseline-medals">{t("medals-faq__content_6")}</a>
          </li>
          <li>
            <a href="#peer-medals">{t("medals-faq__content_7")}</a>
          </li>
          <li>
            <a href="#tournament-medals">{t("medals-faq__content_8")}</a>
          </li>
          <li>
            <a href="#comments-medals">{t("medals-faq__content_9")}</a>
          </li>
          <li>
            <a href="#question-writing-medals">{t("medals-faq__content_10")}</a>
          </li>
          <li>
            <a href="#writing-time-periods">{t("medals-faq__content_11")}</a>
          </li>
          <li>
            <a href="#scores-time-periods">{t("medals-faq__content_12")}</a>
          </li>
          <li>
            <a href="#h-indexes">{t("medals-faq__content_13")}</a>
          </li>
          <li>
            <a href="#fractional-h-index">{t("medals-faq__content_14")}</a>
          </li>
          <li>
            <a href="#medal-tiers">{t("medals-faq__content_15")}</a>
          </li>
          <li>
            <a href="#medals-forever">{t("medals-faq__content_16")}</a>
          </li>
        </ul>
      </div>

      <hr className="my-8" />

      <h2 className="scroll-mt-nav" id="metaculus-medals">
        {t("medals-faq_WhatareMetaculusmedals?")}
      </h2>
      <p>{t("medals-faq_metaculus-medals_content_1")}</p>

      <p>
        {t("medals-faq_metaculus-medals_content_2")}
        <a href="/leaderboard/">{t("medals-faq_metaculus-medals_content_3")}</a>
        {t("medals-faq_metaculus-medals_content_4")}
        <a href="#peer-medals">
          {t("medals-faq_metaculus-medals_content_5")}
        </a>,{" "}
        <a href="#baseline-medals">
          {t("medals-faq_metaculus-medals_content_6")}
        </a>
        ,{" "}
        <a href="#comments-medals">
          {t("medals-faq_metaculus-medals_content_7")}
        </a>
        {t("medals-faq_metaculus-medals_content_8")}
        <a href="#question-writing-medals">
          {t("medals-faq_metaculus-medals_content_9")}
        </a>
        {t("medals-faq_metaculus-medals_content_10")}
        <a href="/help/scores-faq/#metaculus-tournaments">
          {t("medals-faq_metaculus-medals_content_11")}
        </a>
        {t("medals-faq_metaculus-medals_content_12")}
      </p>

      <p>{t("medals-faq_metaculus-medals_content_13")}</p>

      <p>
        {t("medals-faq_metaculus-medals_content_14")}
        <a href="/tournament/Q42022-beginner-tournament/">1</a>,{" "}
        <a href="/tournament/Q12023-beginner-tournament/">2</a>,{" "}
        <a href="/tournament/beginner-tournament/">3</a>
        {t("medals-faq_metaculus-medals_content_15")}
      </p>

      <p>
        {t("medals-faq_metaculus-medals_content_16")}
        <a href="/leaderboard/">
          {t("medals-faq_metaculus-medals_content_17")}
        </a>
        {t("medals-faq_metaculus-medals_content_18")}
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="baseline-medals">
        {t("medals-faq_WhatareBaselineAccuracymedals?")}
      </h2>
      <p>{t("medals-faq_baseline-medals_content_1")}</p>
      <p>
        {t("medals-faq_baseline-medals_content_2")}
        <a href="/help/scores-faq/#baseline-score">
          {t("medals-faq_baseline-medals_content_3")}
        </a>
        {t("medals-faq_baseline-medals_content_4")}
        <a href="#scores-time-periods">
          {t("medals-faq_baseline-medals_content_5")}
        </a>
        .
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="peer-medals">
        {t("medals-faq_WhatarePeerAccuracymedals?")}
      </h2>
      <p>{t("medals-faq_peer-medals_content_1")}</p>
      <p>
        {t("medals-faq_peer-medals_content_2")}
        <a href="/help/scores-faq/#peer-score">
          {t("medals-faq_peer-medals_content_3")}
        </a>
        {t("medals-faq_peer-medals_content_4")}
        <a href="/help/scores-faq/#coverage">
          {t("medals-faq_peer-medals_content_5")}
        </a>
        {t("medals-faq_peer-medals_content_6")}
        <a href="#scores-time-periods">
          {t("medals-faq_peer-medals_content_7")}
        </a>
        {t("medals-faq_peer-medals_content_8")}
      </p>
      <p>{t("medals-faq_peer-medals_content_9")}</p>
      <p>
        {t("medals-faq_peer-medals_content_10")}
        <a href="/notebooks/20027/scores-and-medals-trade-offs-and-decisions/#update-july-2024-implementing-idea-4">
          {t("medals-faq_peer-medals_content_11")}
        </a>
        {t("medals-faq_peer-medals_content_12")}
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="tournament-medals">
        {t("medals-faq_Whataretournamentmedals?")}
      </h2>
      <p>{t("medals-faq_tournament-medals_content_1")}</p>
      <p>
        {t("medals-faq_tournament-medals_content_2")}
        <a href="/tournament/Q42022-beginner-tournament/">1</a>,{" "}
        <a href="/tournament/Q12023-beginner-tournament/">2</a>,{" "}
        <a href="/tournament/beginner-tournament/">3</a>
        {t("medals-faq_tournament-medals_content_3")}
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="comments-medals">
        {t("medals-faq_WhatareCommentsmedals?")}
      </h2>
      <p>{t("medals-faq_comments-medals_content_1")}</p>

      <p>
        {t("medals-faq_comments-medals_content_2")}
        <a href="/help/medals-faq/#h-indexes">
          {t("medals-faq_comments-medals_content_3")}
        </a>
        {t("medals-faq_comments-medals_content_4")}
        <a href="/help/medals-faq/#writing-time-periods">
          {t("medals-faq_comments-medals_content_5")}
        </a>
        .
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="question-writing-medals">
        {t("medals-faq_WhatareQuestionWritingmedals?")}
      </h2>
      <p>{t("medals-faq_question-writing-medals_content_1")}</p>

      <p>
        {t("medals-faq_question-writing-medals_content_2")}
        <a href="/help/medals-faq/#h-indexes">
          {t("medals-faq_question-writing-medals_content_3")}
        </a>
        {t("medals-faq_question-writing-medals_content_4")}
        <a href="/help/medals-faq/#writing-time-periods">
          {t("medals-faq_question-writing-medals_content_5")}
        </a>
        {t("medals-faq_question-writing-medals_content_6")}
      </p>

      <p>{t("medals-faq_question-writing-medals_content_7")}</p>

      <p>{t("medals-faq_question-writing-medals_content_8")}</p>
      <hr />

      <h2 className="scroll-mt-nav" id="writing-time-periods">
        {t(
          "medals-faq_WhataretheTimesPeriodsforComments&Questionwritingmedals?"
        )}
      </h2>
      <p>{t("medals-faq_writing-time-periods_content_1")}</p>

      <p>{t("medals-faq_writing-time-periods_content_2")}</p>
      <hr />

      <h2 className="scroll-mt-nav" id="scores-time-periods">
        {t("medals-faq_WhataretheTimePeriodsforBaseline&Peermedals?")}
      </h2>
      <p>{t("medals-faq_scores-time-periods_content_1")}</p>

      <p>{t("medals-faq_scores-time-periods_content_2")}</p>

      <p>{t("medals-faq_scores-time-periods_content_3")}</p>
      <ul className="ml-5 list-disc">
        <li>{t("medals-faq_scores-time-periods_content_4")}</li>
        <li>{t("medals-faq_scores-time-periods_content_5")}</li>
        <ul className="ml-5 list-disc">
          <li>{t("medals-faq_scores-time-periods_content_6")}</li>
          <li>
            {t("medals-faq_scores-time-periods_content_7")}
            <b>{t("medals-faq_scores-time-periods_content_8")}</b>
            {t("medals-faq_scores-time-periods_content_9")}
            <b>{t("medals-faq_scores-time-periods_content_10")}</b>
            {t("medals-faq_scores-time-periods_content_11")}
            <i>{t("medals-faq_scores-time-periods_content_12")}</i>
          </li>
          <li>
            {t("medals-faq_scores-time-periods_content_13")}
            <i>{t("medals-faq_scores-time-periods_content_14")}</i>
          </li>
        </ul>
      </ul>
      <p>{t("medals-faq_scores-time-periods_content_15")}</p>
      <p>{t("medals-faq_scores-time-periods_content_16")}</p>
      <hr />
      <h2 className="scroll-mt-nav" id="h-indexes">
        {t("medals-faq_Whatareh-indexes?")}
      </h2>
      <p>
        {t("medals-faq_h-indexes_content_1")}
        <a href="https://en.wikipedia.org/wiki/h-index">
          {t("medals-faq_h-indexes_content_2")}
        </a>
        {t("medals-faq_h-indexes_content_3")}
      </p>
      <p>{t("medals-faq_h-indexes_content_4")}</p>
      <p>{t("medals-faq_h-indexes_content_5")}</p>

      <hr />
      <h2 className="scroll-mt-nav" id="fractional-h-index">
        {t("medals-faq_Whatisthefractionalh-index?")}
      </h2>
      <p>{t("medals-faq_fractional-h-index_content_1")}</p>
      <p>{t("medals-faq_fractional-h-index_content_2")}</p>
      <p>{t("medals-faq_fractional-h-index_content_3")}</p>
      <p>2 + (1 + 2) / 5 = 2.6</p>
      <p>{t("medals-faq_fractional-h-index_content_4")}</p>
      <KatexRenderer
        equation={
          "H_f = H + \\frac{ \\sum_{i=1}^{H+1} \\min(v_i, H+1) - H^2 }{ (H+1)^2 - H^2 }"
        }
        inline={false}
      />
      <p>
        {t("medals-faq_fractional-h-index_content_5")}
        <KatexRenderer equation="H" inline />
        {t("medals-faq_fractional-h-index_content_6")}
        <KatexRenderer equation="v_i" inline />
        {t("medals-faq_fractional-h-index_content_7")}
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="medal-tiers">
        {t("medals-faq_Howaremedaltiersdetermined?")}
      </h2>
      <p>{t("medals-faq_medal-tiers_content_1")}</p>
      <ul className="ml-5 list-disc">
        <li>{t("medals-faq_medal-tiers_content_2")}</li>
        <li>{t("medals-faq_medal-tiers_content_3")}</li>
        <li>{t("medals-faq_medal-tiers_content_4")}</li>
      </ul>
      <p>{t("medals-faq_medal-tiers_content_5")}</p>
      <ul className="ml-5 list-disc">
        <li>{t("medals-faq_medal-tiers_content_6")}</li>
        <li>{t("medals-faq_medal-tiers_content_7")}</li>
        <li>{t("medals-faq_medal-tiers_content_8")}</li>
        <li>{t("medals-faq_medal-tiers_content_9")}</li>
      </ul>
      <p>{t("medals-faq_medal-tiers_content_10")}</p>
      <ul className="ml-5 list-disc">
        <li>{t("medals-faq_medal-tiers_content_11")}</li>
        <li>{t("medals-faq_medal-tiers_content_12")}</li>
        <li>{t("medals-faq_medal-tiers_content_13")}</li>
      </ul>
      <hr />
      <h2 className="scroll-mt-nav" id="medals-forever">
        {t("medals-faq_Aremedalsforever?")}
      </h2>
      <p>{t("medals-faq_medals-forever_content_1")}</p>
      <p>{t("medals-faq_medals-forever_content_2")}</p>
    </PageWrapper>
  );
}
