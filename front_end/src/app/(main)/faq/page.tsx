import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import KatexRenderer from "@/components/katex_renderer";

import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus FAQ",
  description:
    "Frequently asked questions about Metaculus, including basics, question types, resolution processes, predictions, scoring, and more.",
};

export default function FAQ() {
  const t = useTranslations();
  return (
    <PageWrapper>
      <h1 className="text-3xl font-bold">{t("faq_MetaculusFAQ")}</h1>
      <hr />
      <div className="flex flex-col">
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_1")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatismetaculus">{t("faq__content_2")}</a>
            </li>
            <li>
              <a href="#whatisforecasting">{t("faq__content_3")}</a>
            </li>
            <li>
              <a href="#whenforecastingvaluable">{t("faq__content_4")}</a>
            </li>
            <li>
              <a href="#aim">{t("faq__content_5")}</a>
            </li>
            <li>
              <a href="#whocreated">{t("faq__content_6")}</a>
            </li>
            <li>
              <a href="#whattournaments">{t("faq__content_7")}</a>
            </li>
            <li>
              <a href="#predmarket">{t("faq__content_8")}</a>
            </li>
            <li>
              <a href="#justpolling">{t("faq__content_9")}</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_10")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatsort">{t("faq__content_11")}</a>
            </li>
            <li>
              <a href="#whocreates">{t("faq__content_12")}</a>
            </li>
            <li>
              <a href="#whoedits">{t("faq__content_13")}</a>
            </li>
            <li>
              <a href="#question-submission">{t("faq__content_14")}</a>
            </li>
            <li>
              <a href="#pending-question">{t("faq__content_15")}</a>
            </li>
            <li>
              <a href="#admins-resolution">{t("faq__content_16")}</a>
            </li>
            <li>
              <a href="#question-private">{t("faq__content_17")}</a>
            </li>
            <li>
              <a href="#comments">{t("faq__content_18")}</a>
            </li>
            <li>
              <a href="#definitions">{t("faq__content_19")}</a>
            </li>
            <li>
              <a href="#question-types">{t("faq__content_20")}</a>
            </li>
            <li>
              <a href="#question-groups">{t("faq__content_21")}</a>
            </li>
            <li>
              <a href="#conditionals">{t("faq__content_22")}</a>
            </li>
            <li>
              <a href="#navigation-and-filtering">{t("faq__content_23")}</a>
            </li>
          </ul>
        </div>

        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_24")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#closers">{t("faq__content_25")}</a>
            </li>
            <li>
              <a href="#timezone">{t("faq__content_26")}</a>
            </li>
            <li>
              <a href="#who-resolves">{t("faq__content_27")}</a>
            </li>
            <li>
              <a href="#ambiguous-annulled">{t("faq__content_28")}</a>
            </li>
            <li>
              <a href="#allres">{t("faq__content_29")}</a>
            </li>
            <li>
              <a href="#whenresolve">{t("faq__content_30")}</a>
            </li>
            <li>
              <a href="#resolvebackground">{t("faq__content_31")}</a>
            </li>
            <li>
              <a href="#unclearresolve">{t("faq__content_32")}</a>
            </li>
            <li>
              <a href="#reresolve">{t("faq__content_33")}</a>
            </li>
            <li>
              <a href="#whatifres">{t("faq__content_34")}</a>
            </li>
            <li>
              <a href="#retroactive-closure">{t("faq__content_35")}</a>
            </li>
            <li>
              <a href="#whatifres2">{t("faq__content_36")}</a>
            </li>
            <li>
              <a href="#ressrc">{t("faq__content_37")}</a>
            </li>
            <li>
              <a href="#rescouncil">{t("faq__content_38")}</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_39")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#tutorial">{t("faq__content_40")}</a>
            </li>
            <li>
              <a href="#howpredict">{t("faq__content_41")}</a>
            </li>
            <li>
              <a href="#howwithdraw">{t("faq__content_42")}</a>
            </li>
            <li>
              <a href="#range-interface">{t("faq__content_43")}</a>
            </li>
            <li>
              <a href="#community-prediction">{t("faq__content_44")}</a>
            </li>
            <li>
              <a href="#metaculus-prediction">{t("faq__content_45")}</a>
            </li>
            <li>
              <a href="#public-figure">{t("faq__content_46")}</a>
            </li>
            <li>
              <a href="#reaffirming">{t("faq__content_47")}</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_48")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatscores">{t("faq__content_49")}</a>
            </li>
            <li>
              <a href="#whatmedals">{t("faq__content_50")}</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_51")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatisjournal">{t("faq__content_52")}</a>
            </li>
            <li>
              <a href="#fortifiedessay">{t("faq__content_53")}</a>
            </li>
          </ul>
        </div>
        <hr />
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            {t("faq__content_54")}
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#what-are-pros">{t("faq__content_55")}</a>
            </li>
            <li>
              <a href="#api">{t("faq__content_56")}</a>
            </li>
            <li>
              <a href="#change-name">{t("faq__content_57")}</a>
            </li>
            <li>
              <a href="#cant-comment">{t("faq__content_58")}</a>
            </li>
            <li>
              <a href="#suspensions">{t("faq__content_59")}</a>
            </li>
            <li>
              <a href="#cant-see">{t("faq__content_60")}</a>
            </li>
            <li>
              <a href="#related-news">{t("faq__content_61")}</a>
            </li>
            <li>
              <a href="#community-insights">{t("faq__content_62")}</a>
            </li>
            <li>
              <a href="#domains">{t("faq__content_63")}</a>
            </li>
            <li>
              <a href="#spreadword">{t("faq__content_64")}</a>
            </li>
            <li>
              <a href="#closeaccount">{t("faq__content_65")}</a>
            </li>
          </ul>
        </div>
        <hr />
        <h2 className="scroll-mt-nav text-2xl font-bold" id="basics">
          {t("faq_Basics")}
        </h2>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatismetaculus"
        >
          {t("faq_WhatisMetaculus?")}
        </h3>
        <p>{t("faq_whatismetaculus_content_1")}</p>
        <p>{t("faq_whatismetaculus_content_2")}</p>
        <p>
          {t("faq_whatismetaculus_content_3")}
          <a href="https://en.wikipedia.org/wiki/Eriophyidae">
            {t("faq_whatismetaculus_content_4")}
          </a>
          {t("faq_whatismetaculus_content_5")}
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatisforecasting"
        >
          {t("faq_Whatisforecasting?")}
        </h3>
        <p>{t("faq_whatisforecasting_content_1")}</p>

        <p>{t("faq_whatisforecasting_content_2")}</p>

        <p>
          {t("faq_whatisforecasting_content_3")}
          <a href="https://en.wikipedia.org/wiki/Median">
            {t("faq_whatisforecasting_content_4")}
          </a>
          {t("faq_whatisforecasting_content_5")}
          <a href="/questions/track-record/">
            {t("faq_whatisforecasting_content_6")}
          </a>
          {t("faq_whatisforecasting_content_7")}
          <a href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd">
            {t("faq_whatisforecasting_content_8")}
          </a>
          {t("faq_whatisforecasting_content_9")}
        </p>

        <p>{t("faq_whatisforecasting_content_10")}</p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whenforecastingvaluable"
        >
          {t("faq_Whenisforecastingvaluable?")}
        </h3>
        <p>{t("faq_whenforecastingvaluable_content_1")}</p>
        <p>{t("faq_whenforecastingvaluable_content_2")}</p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="aim">
          {t("faq_WhyshouldIbeaforecaster?")}
        </h3>
        <p>{t("faq_aim_content_1")}</p>
        <p>{t("faq_aim_content_2")}</p>
        <p>{t("faq_aim_content_3")}</p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreated">
          {t("faq_WhocreatedMetaculus?")}
        </h3>
        <p>
          {t("faq_whocreated_content_1")}
          <a href="https://fqxi.org/">{t("faq_whocreated_content_2")}</a>
          {t("faq_whocreated_content_3")}
          <a href="https://futureoflife.org/">
            {t("faq_whocreated_content_4")}
          </a>
          {t("faq_whocreated_content_5")}
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whattournaments"
        >
          {t("faq_WhatAreMetaculusTournamentsandQuestionSeries?")}
        </h3>

        <h4 className="text-lg font-semibold">
          {t("faq_whattournaments_content_1")}
        </h4>
        <p>
          {t("faq_whattournaments_content_2")}
          <a href="/tournaments/">{t("faq_whattournaments_content_3")}</a>.
        </p>
        <p>
          {t("faq_whattournaments_content_4")}
          <a href="/help/medals-faq/">{t("faq_whattournaments_content_5")}</a>
          {t("faq_whattournaments_content_6")}
        </p>
        <p>
          {t("faq_whattournaments_content_7")}
          <a href="/help/scores-faq/#tournament-scores">
            {t("faq_whattournaments_content_8")}
          </a>
          ).
        </p>
        <p>{t("faq_whattournaments_content_9")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_whattournaments_content_10")}
        </h4>
        <p>
          {t("faq_whattournaments_content_11")}
          <a href="/questions/11556/donating-tournament-prizes/">
            {t("faq_whattournaments_content_12")}
          </a>
          .
        </p>

        <h4 className="text-lg font-semibold">
          {t("faq_whattournaments_content_13")}
        </h4>
        <p>{t("faq_whattournaments_content_14")}</p>
        <p>
          {t("faq_whattournaments_content_15")}
          <b>{t("faq_whattournaments_content_16")}</b>
          {t("faq_whattournaments_content_17")}
        </p>
        <p>
          {t("faq_whattournaments_content_18")}
          <a href="/tournaments/">{t("faq_whattournaments_content_19")}</a>.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="predmarket">
          {t("faq_IsMetaculusapredictionmarket?")}
        </h3>
        <p>{t("faq_predmarket_content_1")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_predmarket_content_2")}
        </h4>
        <p>{t("faq_predmarket_content_3")}</p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            <b>{t("faq_predmarket_content_4")}</b>
            {t("faq_predmarket_content_5")}
            <a href="https://wip.gatspress.com/wp-content/uploads/2024/05/thu9F-cumulative-traded-volume-on-the-2020-us-election-4-1024x897.png">
              {t("faq_predmarket_content_6")}
            </a>
            {t("faq_predmarket_content_7")}
            <a href="https://worksinprogress.co/issue/why-prediction-markets-arent-popular/">
              {t("faq_predmarket_content_8")}
            </a>
            {t("faq_predmarket_content_9")}
          </li>
          <li>
            <b>{t("faq_predmarket_content_10")}</b>
            {t("faq_predmarket_content_11")}
            <a href="https://polymarket.com/event/democratic-nominee-2024?tid=1724174308005">
              {t("faq_predmarket_content_12")}
            </a>
            .
          </li>
          <li>
            <b>{t("faq_predmarket_content_13")}</b>
            {t("faq_predmarket_content_14")}
            <a href="https://asteriskmag.com/issues/05/prediction-markets-have-an-elections-problem-jeremiah-johnson">
              {t("faq_predmarket_content_15")}
            </a>
            {t("faq_predmarket_content_16")}
          </li>
          <li>
            <b>{t("faq_predmarket_content_17")}</b>
            {t("faq_predmarket_content_18")}
          </li>
          <li>
            <b>{t("faq_predmarket_content_19")}</b>
            {t("faq_predmarket_content_20")}
            <a href="https://www.cspicenter.com/p/salem-tournament-5-days-in#:~:text=The%20first%20problem%20we%20saw%20was%20that%20there%20were%20some%20individuals%20who%20made%20a%20killing%20by%20taking%20advantage%20of%20those%20who%20did%20not%20know%20how%20the%20markets%20work%20(see%20discussion%20here).">
              {t("faq_predmarket_content_21")}
            </a>
            {t("faq_predmarket_content_22")}
          </li>
          <li>
            <b>{t("faq_predmarket_content_23")}</b>
            {t("faq_predmarket_content_24")}
            <a href="https://www.metaculus.com/notebooks/15359/predictive-performance-on-metaculus-vs-manifold-markets/">
              {t("faq_predmarket_content_25")}
            </a>{" "}
            <a href="https://firstsigma.substack.com/p/midterm-elections-forecast-comparison-analysis">
              {t("faq_predmarket_content_26")}
            </a>
            {t("faq_predmarket_content_27")}
            <a href="https://www.astralcodexten.com/p/who-predicted-2023">
              {t("faq_predmarket_content_28")}
            </a>
            {t("faq_predmarket_content_29")}
            <a href="https://calibration.city/">
              {t("faq_predmarket_content_30")}
            </a>
            {t("faq_predmarket_content_31")}
          </li>
        </ol>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="justpolling">
          {t("faq_AreMetaculusQuestionsPolls?")}
        </h3>
        <p>
          {t("faq_justpolling_content_1")}
          <a href="https://news.gallup.com/poll/391547/seven-year-stretch-elevated-environmental-concern.aspx">
            {t("faq_justpolling_content_2")}
          </a>
          {t("faq_justpolling_content_3")}
        </p>

        <p>
          {t("faq_justpolling_content_4")}
          <a href="/questions/9942/brent-oil-to-breach-140-before-may">
            {t("faq_justpolling_content_5")}
          </a>
          {t("faq_justpolling_content_6")}
          <a href="/faq/#metaculus-prediction">
            {t("faq_justpolling_content_7")}
          </a>
          {t("faq_justpolling_content_8")}
          <a href="/questions/track-record/">
            {t("faq_justpolling_content_9")}
          </a>
          .
        </p>

        <h2
          className="scroll-mt-nav scroll-mt-nav text-2xl font-bold"
          id="metaculus-questions"
        >
          {t("faq_MetaculusQuestions")}
        </h2>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whatsort">
          {t("faq_Whatsortsofquestionsareallowed,andwhatmakesagoodquestion?")}
        </h3>
        <p>
          {t("faq_whatsort_content_1")}
          <q>
            <a href="/questions/8579/us-freedom-in-the-world-score-in-2050/">
              {t("faq_whatsort_content_2")}
            </a>
          </q>
          {t("faq_whatsort_content_3")}
          <q>{t("faq_whatsort_content_4")}</q>
          {t("faq_whatsort_content_5")}
          <q>{t("faq_whatsort_content_6")}</q>
          {t("faq_whatsort_content_7")}
          <q>{t("faq_whatsort_content_8")}</q>
        </p>
        <p>{t("faq_whatsort_content_9")}</p>
        <p>{t("faq_whatsort_content_10")}</p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>{t("faq_whatsort_content_11")}</li>
          <li>{t("faq_whatsort_content_12")}</li>
          <li>{t("faq_whatsort_content_13")}</li>
          <li>{t("faq_whatsort_content_14")}</li>
        </ol>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreates">
          {t("faq_Whocreatesthequestions,andwhodecideswhichgetposted?")}
        </h3>
        <p>
          {t("faq_whocreates_content_1")}
          <a href="/question-writing/">{t("faq_whocreates_content_2")}</a>.
        </p>

        <p>
          {t("faq_whocreates_content_3")}
          <a href="/questions/categories/">{t("faq_whocreates_content_4")}</a>
          {t("faq_whocreates_content_5")}
          <a href="/questions/?categories=technology">
            {t("faq_whocreates_content_6")}
          </a>
          ,{" "}
          <a href="/questions/?tags=effective-altruism">
            {t("faq_whocreates_content_7")}
          </a>
          , <a href="/questions/?topic=ai">{t("faq_whocreates_content_8")}</a>,{" "}
          <a href="/questions/?topic=biosecurity">
            {t("faq_whocreates_content_9")}
          </a>
          {t("faq_whocreates_content_10")}
          <a href="/questions/?categories=geopolitics">
            {t("faq_whocreates_content_11")}
          </a>
          .
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="whoedits">
          {t("faq_Whocaneditquestions?")}
        </h3>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>{t("faq_whoedits_content_1")}</li>
          <li>{t("faq_whoedits_content_2")}</li>
          <li>{t("faq_whoedits_content_3")}</li>
          <li>{t("faq_whoedits_content_4")}</li>
        </ul>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-submission"
        >
          {t("faq_HowcanIgetmyownquestionposted?")}
        </h3>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            {t("faq_question-submission_content_1")}
            <a href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              {t("faq_question-submission_content_2")}
            </a>
            {t("faq_question-submission_content_3")}
            <a href="https://discord.gg/v2Bf5tppeT">
              {t("faq_question-submission_content_4")}
            </a>
            .
          </li>
          <li>{t("faq_question-submission_content_5")}</li>
          <li>
            {t("faq_question-submission_content_6")}
            <a href="/questions/categories/">
              {t("faq_question-submission_content_7")}
            </a>
            {t("faq_question-submission_content_8")}
            <a href="/questions/?categories=technology">
              {t("faq_question-submission_content_9")}
            </a>
            ,{" "}
            <a href="/questions/?tags=effective-altruism">
              {t("faq_question-submission_content_10")}
            </a>
            ,{" "}
            <a href="/questions/?topic=ai">
              {t("faq_question-submission_content_11")}
            </a>
            ,{" "}
            <a href="/questions/?topic=biosecurity">
              {t("faq_question-submission_content_12")}
            </a>
            {t("faq_question-submission_content_13")}
            <a href="/questions/?categories=geopolitics">
              {t("faq_question-submission_content_14")}
            </a>
            {t("faq_question-submission_content_15")}
          </li>
          <li>{t("faq_question-submission_content_16")}</li>
        </ol>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="pending-question"
        >
          {t("faq_WhatcanIdoifaquestionIsubmittedhasbeenpendingforalongtime?")}
        </h3>
        <p>
          {t("faq_pending-question_content_1")}
          <a href="/questions/?categories=technology">
            {t("faq_pending-question_content_2")}
          </a>
          ,{" "}
          <a href="/questions/?tags=effective-altruism">
            {t("faq_pending-question_content_3")}
          </a>
          ,{" "}
          <a href="/questions/?topic=ai">
            {t("faq_pending-question_content_4")}
          </a>
          ,{" "}
          <a href="/questions/?topic=biosecurity">
            {t("faq_pending-question_content_5")}
          </a>
          {t("faq_pending-question_content_6")}
          <a href="/questions/?categories=geopolitics">
            {t("faq_pending-question_content_7")}
          </a>
          {t("faq_pending-question_content_8")}
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="admins-resolution"
        >
          {t("faq_WhatcanIdoifaquestionshouldberesolvedbutisnt?")}
        </h3>
        <p>{t("faq_admins-resolution_content_1")}</p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-private"
        >
          {t("faq_Whatisaprivatequestion?")}
        </h3>
        <p>{t("faq_question-private_content_1")}</p>
        <p>
          {t("faq_question-private_content_2")}
          <strong>{t("faq_question-private_content_3")}</strong>
          {t("faq_question-private_content_4")}
        </p>
        <p>{t("faq_question-private_content_5")}</p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="comments">
          {t("faq_Whataretherulesandguidelinesforcommentsanddiscussions?")}
        </h3>
        <p>
          {t("faq_comments_content_1")}
          <a href="/help/guidelines/">{t("faq_comments_content_2")}</a>
          {t("faq_comments_content_3")}
        </p>

        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>{t("faq_comments_content_4")}</li>
          <li>
            {t("faq_comments_content_5")}
            <a href="/help/markdown/">{t("faq_comments_content_6")}</a>
          </li>
          <li>
            {t("faq_comments_content_7")}
            <a href="/terms-of-use/">{t("faq_comments_content_8")}</a>
            {t("faq_comments_content_9")}
          </li>
          <li>{t("faq_comments_content_10")}</li>
          <li>
            {t("faq_comments_content_11")}
            <a href="/help/guidelines/">{t("faq_comments_content_12")}</a>.
          </li>
          <li>{t("faq_comments_content_13")}</li>
        </ul>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="definitions">
          {t(
            'faq_Whatdo"crediblesource"and"before[dateX]"andsuchphrasesmeanexactly?'
          )}
        </h3>
        <p>{t("faq_definitions_content_1")}</p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>{t("faq_definitions_content_2")}</li>
          <li>
            {t("faq_definitions_content_3")}
            <ul className="ml-4 mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>{t("faq_definitions_content_4")}</strong>
                {t("faq_definitions_content_5")}
              </li>
            </ul>
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="question-types">
          {t("faq_Whattypesofquestionsarethere?")}
        </h3>
        <h4 className="text-lg font-semibold">
          {t("faq_question-types_content_1")}
        </h4>
        <p>
          {t("faq_question-types_content_2")}
          <strong>{t("faq_question-types_content_3")}</strong>
          {t("faq_question-types_content_4")}
          <strong>{t("faq_question-types_content_5")}</strong>
          {t("faq_question-types_content_6")}
          <strong>{t("faq_question-types_content_7")}</strong>
          {t("faq_question-types_content_8")}
          <a href="/questions/6296/us-unemployment-above-5-through-nov-2021/">
            {t("faq_question-types_content_9")}
          </a>
          {t("faq_question-types_content_10")}
          <strong>{t("faq_question-types_content_11")}</strong>
          {t("faq_question-types_content_12")}
        </p>

        <h4 className="text-lg font-semibold">
          {t("faq_question-types_content_13")}
        </h4>
        <p>
          {t("faq_question-types_content_14")}
          <a href="#out-of-bounds-resolution">
            {t("faq_question-types_content_15")}
          </a>
          {t("faq_question-types_content_16")}
        </p>
        <p>
          {t("faq_question-types_content_17")}
          <a href="#range-interface">{t("faq_question-types_content_18")}</a>
          {t("faq_question-types_content_19")}
        </p>
        <p>{t("faq_question-types_content_20")}</p>

        <h5 className="text-lg font-semibold">
          {t("faq_question-types_content_21")}
        </h5>
        <p>
          {t("faq_question-types_content_22")}
          <a href="/questions/7346/initial-jobless-claims-july-2021/">
            {t("faq_question-types_content_23")}
          </a>
          {t("faq_question-types_content_24")}
          <strong>395</strong>
          {t("faq_question-types_content_25")}
        </p>
        <p>
          {t("faq_question-types_content_26")}
          <a href="/questions/6645/highest-us-core-cpi-growth-in-2021/">
            {t("faq_question-types_content_27")}
          </a>
          {t("faq_question-types_content_28")}
          <strong>{t("faq_question-types_content_29")}</strong>
          {t("faq_question-types_content_30")}
        </p>

        <h5 className="text-lg font-semibold">
          {t("faq_question-types_content_31")}
        </h5>
        <p>
          {t("faq_question-types_content_32")}
          <a href="/questions/8723/date-of-next-who-pheic-declaration/">
            {t("faq_question-types_content_33")}
          </a>
          {t("faq_question-types_content_34")}
          <strong>{t("faq_question-types_content_35")}</strong>
          {t("faq_question-types_content_36")}
        </p>
        <p>
          {t("faq_question-types_content_37")}
          <a href="/questions/6947/first-super-heavy-flight/">
            {t("faq_question-types_content_38")}
          </a>
          {t("faq_question-types_content_39")}
          <strong>{t("faq_question-types_content_40")}</strong>
          {t("faq_question-types_content_41")}
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-groups"
        >
          {t("faq_Whatarequestiongroups?")}
        </h3>
        <p>{t("faq_question-groups_content_1")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_question-groups_content_2")}
        </h4>
        <p>{t("faq_question-groups_content_3")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_question-groups_content_4")}
        </h4>
        <p>{t("faq_question-groups_content_5")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_question-groups_content_6")}
        </h4>
        <p>
          {t("faq_question-groups_content_7")}
          <i>{t("faq_question-groups_content_8")}</i>
          {t("faq_question-groups_content_9")}
        </p>

        <h4 className="text-lg font-semibold">
          {t("faq_question-groups_content_10")}
        </h4>
        <p>{t("faq_question-groups_content_11")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_question-groups_content_12")}
        </h4>
        <p>{t("faq_question-groups_content_13")}</p>
        <p>
          {t("faq_question-groups_content_14")}
          <a href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            {t("faq_question-groups_content_15")}
          </a>
          .
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="conditionals">
          {t("faq_WhatareConditionalPairs?")}
        </h3>
        <p>
          {t("faq_conditionals_content_1")}
          <a href="/faq/#question-groups">{t("faq_conditionals_content_2")}</a>
          {t("faq_conditionals_content_3")}
          <a href="https://en.wikipedia.org/wiki/Conditional_probability">
            {t("faq_conditionals_content_4")}
          </a>
          {t("faq_conditionals_content_5")}
          <a href="/faq/#question-types">{t("faq_conditionals_content_6")}</a>.
        </p>

        <p>{t("faq_conditionals_content_7")}</p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>{t("faq_conditionals_content_8")}</li>
          <li>{t("faq_conditionals_content_9")}</li>
        </ol>

        <p>{t("faq_conditionals_content_10")}</p>

        <p>{t("faq_conditionals_content_11")}</p>

        <Image
          src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_2.jpg"
          alt="The two conditionals next to each other"
          width={730}
          height={75}
        />

        <p>{t("faq_conditionals_content_12")}</p>

        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            {t("faq_conditionals_content_13")}
            <a href="/faq/#ambiguous-annulled">
              {t("faq_conditionals_content_14")}
            </a>
            {t("faq_conditionals_content_15")}
          </li>
          <li>{t("faq_conditionals_content_16")}</li>
        </ul>

        <p>{t("faq_conditionals_content_17")}</p>

        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>{t("faq_conditionals_content_18")}</li>
          <li>{t("faq_conditionals_content_19")}</li>
        </ul>

        <p>{t("faq_conditionals_content_20")}</p>

        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>{t("faq_conditionals_content_21")}</li>
          <li>{t("faq_conditionals_content_22")}</li>
        </ol>

        <p>{t("faq_conditionals_content_23")}</p>

        <Image
          src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_3.jpg"
          alt="The Conditional Pair forecasting interface"
          width={754}
          height={253}
        />

        <p>{t("faq_conditionals_content_24")}</p>

        <Image
          src="https://metaculus-public.s3.us-west-2.amazonaws.com/conditional_faq_1.jpg"
          alt="The Conditional Pair feed tile"
          width={746}
          height={142}
        />

        <p>{t("faq_conditionals_content_25")}</p>

        <p>{t("faq_conditionals_content_26")}</p>

        <p>{t("faq_conditionals_content_27")}</p>

        <h4 className="text-lg font-semibold">
          {t("faq_conditionals_content_28")}
        </h4>
        <p>
          {t("faq_conditionals_content_29")}
          <a href="/questions/create/">{t("faq_conditionals_content_30")}</a>
          {t("faq_conditionals_content_31")}
        </p>

        <p>{t("faq_conditionals_content_32")}</p>

        <p>{t("faq_conditionals_content_33")}</p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="navigation-and-filtering"
        >
          {t("faq_HowdoIfindcertainquestionsonMetaculus?")}
        </h3>
        <p>
          {t("faq_navigation-and-filtering_content_1")}
          <a href="/questions/">
            {t("faq_navigation-and-filtering_content_2")}
          </a>
          {t("faq_navigation-and-filtering_content_3")}
        </p>

        <h4 className="scroll-mt-nav text-lg font-semibold" id="search-bar">
          {t("faq_SearchBar")}
        </h4>
        <p>{t("faq_search-bar_content_1")}</p>

        <h4 className="scroll-mt-nav text-lg font-semibold" id="filters">
          {t("faq_Filters")}
        </h4>
        <p>{t("faq_filters_content_1")}</p>

        <h2
          className="scroll-mt-nav scroll-mt-nav text-2xl font-bold"
          id="question-resolution"
        >
          {t("faq_QuestionResolution")}
        </h2>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="closers">
          {t('faq_Whatarethe"opendate","closedate"and"resolvedate?"')}
        </h3>
        <p>{t("faq_closers_content_1")}</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            {t("faq_closers_content_2")}
            <strong>{t("faq_closers_content_3")}</strong>
            {t("faq_closers_content_4")}
          </li>
          <li>
            {t("faq_closers_content_5")}
            <strong>{t("faq_closers_content_6")}</strong>
            {t("faq_closers_content_7")}
          </li>
          <li>
            {t("faq_closers_content_8")}
            <strong>{t("faq_closers_content_9")}</strong>
            {t("faq_closers_content_10")}
          </li>
        </ul>
        <p>
          {t("faq_closers_content_11")}
          <strong>{t("faq_closers_content_12")}</strong>
          {t("faq_closers_content_13")}
        </p>
        <p>
          {t("faq_closers_content_14")}
          <em>{t("faq_closers_content_15")}</em>
          {t("faq_closers_content_16")}
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>{t("faq_closers_content_17")}</li>
          <li>
            {t("faq_closers_content_18")}
            <a href="/faq/#retroactive-closure">
              {t("faq_closers_content_19")}
            </a>
            {t("faq_closers_content_20")}
          </li>
          <li>{t("faq_closers_content_21")}</li>
        </ul>
        <p>
          <strong>{t("faq_closers_content_22")}</strong>
          {t("faq_closers_content_23")}
          <a href="/questions/10801/discontinuing-the-final-forecast-bonus/">
            {t("faq_closers_content_24")}
          </a>
          .
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="timezone">
          {t("faq_Whattimezoneisusedforquestions?")}
        </h3>
        <p>
          {t("faq_timezone_content_1")}
          <a href="https://en.wikipedia.org/wiki/Coordinated_Universal_Time">
            {t("faq_timezone_content_2")}
          </a>
          {t("faq_timezone_content_3")}
        </p>
        <p>
          {t("faq_timezone_content_4")}
          <a href="/faq/#question-types">{t("faq_timezone_content_5")}</a>
          {t("faq_timezone_content_6")}
          <a href="/faq/#whenresolve">{t("faq_timezone_content_7")}</a>
          {t("faq_timezone_content_8")}
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="who-resolves">
          {t("faq_Whodecidestheresolutiontoaquestion?")}
        </h3>
        <p>
          {t("faq_who-resolves_content_1")}
          <strong>{t("faq_who-resolves_content_2")}</strong>,{" "}
          <strong>{t("faq_who-resolves_content_3")}</strong>,{" "}
          <a href="/faq/#ambiguous-annulled">
            {t("faq_who-resolves_content_4")}
          </a>
          {t("faq_who-resolves_content_5")}
          <a href="/faq/#ambiguous-annulled">
            {t("faq_who-resolves_content_6")}
          </a>
          .
        </p>

        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="ambiguous-annulled"
        >
          {t('faq_Whatare"Ambiguous"and"Annulled"resolutions?')}
        </h3>
        <p>
          {t("faq_ambiguous-annulled_content_1")}
          <q>{t("faq_ambiguous-annulled_content_2")}</q>
          {t("faq_ambiguous-annulled_content_3")}
        </p>
        <p>{t("faq_ambiguous-annulled_content_4")}</p>
        <p>
          {t("faq_ambiguous-annulled_content_5")}
          <a href="/faq/#conditionals">
            {t("faq_ambiguous-annulled_content_6")}
          </a>
          {t("faq_ambiguous-annulled_content_7")}
          <q>{t("faq_ambiguous-annulled_content_8")}</q>
          {t("faq_ambiguous-annulled_content_9")}
        </p>
        <p>{t("faq_ambiguous-annulled_content_10")}</p>
        <p>
          <em>{t("faq_ambiguous-annulled_content_11")}</em>
        </p>

        <div>
          <p className="cursor-pointer font-semibold">
            {t("faq_ambiguous-annulled_content_12")}
          </p>
          <div className="mt-2">
            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="reason-annulled"
            >
              {t("faq_WhywasthisquestionAnnulledorresolvedasAmbiguous?")}
            </h3>
            <p>{t("faq_reason-annulled_content_1")}</p>
            <p>{t("faq_reason-annulled_content_2")}</p>

            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="types-annulled"
            >
              {t("faq_TypesofAmbiguousorAnnulledResolutions")}
            </h3>
            <p>{t("faq_types-annulled_content_1")}</p>
            <p>{t("faq_types-annulled_content_2")}</p>
            <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
              <li>
                <a href="#ambiguous-details">
                  <strong>{t("faq_types-annulled_content_3")}</strong>
                </a>
                <strong>.</strong>
                {t("faq_types-annulled_content_4")}
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#no-clear-consensus">
                    <strong>{t("faq_types-annulled_content_5")}</strong>
                  </a>
                  <strong>.</strong>
                  {t("faq_types-annulled_content_6")}
                </li>
              </ul>
              <li>
                <a href="#annulment-details">
                  <strong>{t("faq_types-annulled_content_7")}</strong>
                </a>
                <strong>.</strong>
                {t("faq_types-annulled_content_8")}
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#annulled-underspecified">
                    <strong>{t("faq_types-annulled_content_9")}</strong>
                  </a>
                  <strong>.</strong>
                  {t("faq_types-annulled_content_10")}
                </li>
                <li>
                  <a href="#annulled-subverted">
                    <strong>{t("faq_types-annulled_content_11")}</strong>
                  </a>
                  <strong>.</strong>
                  {t("faq_types-annulled_content_12")}
                </li>
                <li>
                  <a href="#annulled-imbalanced">
                    <strong>{t("faq_types-annulled_content_13")}</strong>
                  </a>
                  <strong>.</strong>
                  {t("faq_types-annulled_content_14")}
                </li>
              </ul>
            </ul>
            <p>
              <strong>{t("faq_types-annulled_content_15")}</strong>
              {t("faq_types-annulled_content_16")}
            </p>

            <h4
              className="scroll-mt-nav text-lg font-semibold"
              id="ambiguous-details"
            >
              {t("faq_AmbiguousResolution")}
            </h4>
            <p>
              {t("faq_ambiguous-details_content_1")}
              <a href="#no-clear-consensus">
                {t("faq_ambiguous-details_content_2")}
              </a>
              .
            </p>
          </div>
        </div>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="no-clear-consensus"
        >
          {t("faq_NoClearConsensus")}
        </h5>
        <p>{t("faq_no-clear-consensus_content_1")}</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <a href="/questions/9459/russian-troops-in-kiev-in-2022/">
              <strong>
                <em>{t("faq_no-clear-consensus_content_2")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_no-clear-consensus_content_3")}
                <a href="/questions/9459/russian-troops-in-kiev-in-2022/#comment-93915">
                  {t("faq_no-clear-consensus_content_4")}
                </a>
                {t("faq_no-clear-consensus_content_5")}
              </li>
            </ul>
          </li>
          <li>
            <a
              href="/questions/10134/average-ransomware-kit-cost-in-2022/"
              target="_blank"
              rel="noopener"
            >
              <strong>
                <em>{t("faq_no-clear-consensus_content_6")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_no-clear-consensus_content_7")}
                <a href="/faq/#ressrc">
                  {t("faq_no-clear-consensus_content_8")}
                </a>
                {t("faq_no-clear-consensus_content_9")}
              </li>
            </ul>
          </li>
        </ul>

        <h4
          className="scroll-mt-nav text-lg font-semibold"
          id="annulment-details"
        >
          {t("faq_Annulment")}
        </h4>
        <p>{t("faq_annulment-details_content_1")}</p>
        <p>
          <strong>{t("faq_annulment-details_content_2")}</strong>
          {t("faq_annulment-details_content_3")}
        </p>

        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-underspecified"
        >
          {t("faq_TheQuestionWasUnderspecified")}
        </h5>
        <p>
          {t("faq_annulled-underspecified_content_1")}
          <em>{t("faq_annulled-underspecified_content_2")}</em>
          {t("faq_annulled-underspecified_content_3")}
        </p>
        <p>{t("faq_annulled-underspecified_content_4")}</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <a href="/questions/12433/substacks-google-trends-at-end-of-2022/">
              <strong>
                <em>{t("faq_annulled-underspecified_content_5")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_annulled-underspecified_content_6")}
                <a href="/questions/12433/substacks-google-trends-at-end-of-2022/#comment-112592">
                  {t("faq_annulled-underspecified_content_7")}
                </a>
                .
              </li>
            </ul>
          </li>
          <li>
            <a href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/">
              <strong>
                <em>{t("faq_annulled-underspecified_content_8")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_annulled-underspecified_content_9")}
                <a href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/#comment-110164">
                  {t("faq_annulled-underspecified_content_10")}
                </a>
                {t("faq_annulled-underspecified_content_11")}
              </li>
            </ul>
          </li>
          <li>
            <a href="/questions/12532/russia-general-mobilization-before-2023/">
              <strong>
                <em>{t("faq_annulled-underspecified_content_12")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_annulled-underspecified_content_13")}
                <a href="/questions/12532/russia-general-mobilization-before-2023/">
                  {t("faq_annulled-underspecified_content_14")}
                </a>
                .
              </li>
            </ul>
          </li>
        </ul>

        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-subverted"
        >
          {t("faq_TheAssumptionsoftheQuestionWereSubverted")}
        </h5>
        <p>{t("faq_annulled-subverted_content_1")}</p>
        <p>{t("faq_annulled-subverted_content_2")}</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <a href="/questions/10444/cause-of-flight-5735-crash/">
              <strong>
                <em>{t("faq_annulled-subverted_content_3")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_annulled-subverted_content_4")}
                <a href="/questions/10444/cause-of-flight-5735-crash/">
                  {t("faq_annulled-subverted_content_5")}
                </a>
                .
              </li>
            </ul>
          </li>
          <li>
            <a href="/questions/6249/november-2021-production-of-semiconductors/">
              <strong>
                <em>{t("faq_annulled-subverted_content_6")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>{t("faq_annulled-subverted_content_7")}</li>
            </ul>
          </li>
          <li>
            <a href="/questions/10048/russia-to-return-to-nuclear-level-1/">
              <strong>
                <em>{t("faq_annulled-subverted_content_8")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                {t("faq_annulled-subverted_content_9")}
                <a href="/questions/10048/russia-to-return-to-nuclear-level-1/#comment-100275">
                  {t("faq_annulled-subverted_content_10")}
                </a>
                .
              </li>
            </ul>
          </li>
          <li>
            <a href="/questions/9000/us-social-cost-of-carbon-in-2022/">
              <strong>
                <em>{t("faq_annulled-subverted_content_11")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>{t("faq_annulled-subverted_content_12")}</li>
            </ul>
          </li>
        </ul>

        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-imbalanced"
        >
          {t("faq_ImbalancedOutcomesandConsistentIncentives")}
        </h5>
        <p>{t("faq_annulled-imbalanced_content_1")}</p>
        <p>{t("faq_annulled-imbalanced_content_2")}</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <a href="/questions/6047/1m-lost-in-prediction-market/">
              <strong>
                <em>{t("faq_annulled-imbalanced_content_3")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>{t("faq_annulled-imbalanced_content_4")}</li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>{t("faq_annulled-imbalanced_content_5")}</li>
              </ul>
            </ul>
          </li>
          <li>
            <a href="/questions/13521/any-ftx-depositor-to-get-anything-out-by-2023/">
              <strong>
                <em>{t("faq_annulled-imbalanced_content_6")}</em>
              </strong>
            </a>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>{t("faq_annulled-imbalanced_content_7")}</li>
            </ul>
          </li>
        </ul>
        <div>
          <h3
            id="allres"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Doallquestionsgetresolved?")}
          </h3>
          <p>{t("faq_allres_content_1")}</p>
        </div>

        <div>
          <h3
            id="whenresolve"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Whenwillaquestionberesolved?")}
          </h3>
          <p>{t("faq_whenresolve_content_1")}</p>
          <p>
            {t("faq_whenresolve_content_2")}
            <q>
              <a href="/questions/3515/when-will-the-first-humans-land-successfully-on-mars/">
                {t("faq_whenresolve_content_3")}
              </a>
            </q>
            {t("faq_whenresolve_content_4")}
            <strong>{t("faq_whenresolve_content_5")}</strong>
            {t("faq_whenresolve_content_6")}
          </p>
        </div>

        <div>
          <h3
            id="resolvebackground"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Isthebackgroundmaterialusedforquestionresolution?")}
          </h3>
          <p>{t("faq_resolvebackground_content_1")}</p>
          <p>{t("faq_resolvebackground_content_2")}</p>
        </div>

        <div>
          <h3
            id="unclearresolve"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t(
              "faq_Whathappensiftheresolutioncriteriaofaquestionisunclearorsuboptimal?"
            )}
          </h3>
          <p>{t("faq_unclearresolve_content_1")}</p>
          <p>
            {t("faq_unclearresolve_content_2")}
            <a href="#ambiguous-annulled">
              {t("faq_unclearresolve_content_3")}
            </a>
            {t("faq_unclearresolve_content_4")}
          </p>
        </div>
        <div>
          <h3
            id="reresolve"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Canquestionsbere-resolved?")}
          </h3>
          <p>{t("faq_reresolve_content_1")}</p>
        </div>

        <div>
          <h3
            id="whatifres"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t(
              "faq_Whathappensifaquestiongetsresolvedintherealworldpriortotheclosetime?"
            )}
          </h3>
          <p>{t("faq_whatifres_content_1")}</p>
          <p>
            {t("faq_whatifres_content_2")}
            <em>{t("faq_whatifres_content_3")}</em>
            {t("faq_whatifres_content_4")}
          </p>
        </div>

        <div>
          <h3
            id="retroactive-closure"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Whenshouldaquestionspecifyretroactiveclosure?")}
          </h3>
          <p>{t("faq_retroactive-closure_content_1")}</p>
          <ul className="ml-5 list-disc">
            <li>
              {t("faq_retroactive-closure_content_2")}
              <strong>{t("faq_retroactive-closure_content_3")}</strong>
              {t("faq_retroactive-closure_content_4")}
            </li>
            <li>
              {t("faq_retroactive-closure_content_5")}
              <a href="https://en.wikipedia.org/wiki/Snap_election">
                {t("faq_retroactive-closure_content_6")}
              </a>
              {t("faq_retroactive-closure_content_7")}
              <strong>
                {t("faq_retroactive-closure_content_8")}
                <ins>{t("faq_retroactive-closure_content_9")}</ins>
                {t("faq_retroactive-closure_content_10")}
              </strong>
              {t("faq_retroactive-closure_content_11")}
            </li>
            <li>
              {t("faq_retroactive-closure_content_12")}
              <a href="/questions/6662/date-earth-functional-satellites-exceed-5000/">
                {t("faq_retroactive-closure_content_13")}
              </a>
              {t("faq_retroactive-closure_content_14")}
              <strong>
                {t("faq_retroactive-closure_content_15")}
                <ins>{t("faq_retroactive-closure_content_16")}</ins>
                {t("faq_retroactive-closure_content_17")}
              </strong>
              {t("faq_retroactive-closure_content_18")}
            </li>
          </ul>
          <p>
            {t("faq_retroactive-closure_content_19")}
            <a href="/help/scores-faq/#score-truncation">
              {t("faq_retroactive-closure_content_20")}
            </a>
            .
          </p>
          <p>{t("faq_retroactive-closure_content_21")}</p>
        </div>

        <div>
          <h3
            id="whatifres2"
            className="mb-4 scroll-mt-nav scroll-mt-nav text-2xl font-semibold"
          >
            {t(
              "faq_Whathappensifaquestionsresolutioncriteriaturnouttohavebeenfulfilledpriortotheopeningtime?"
            )}
          </h3>
          <p>
            {t("faq_whatifres2_content_1")}
            <q>{t("faq_whatifres2_content_2")}</q>
            {t("faq_whatifres2_content_3")}
            <em>{t("faq_whatifres2_content_4")}</em>
            {t("faq_whatifres2_content_5")}
            <q>
              <a href="/questions/8946/facebook-uses-explainable-news-feed-by-2026/)">
                {t("faq_whatifres2_content_6")}
              </a>
            </q>
            {t("faq_whatifres2_content_7")}
            <em>{t("faq_whatifres2_content_8")}</em>
            {t("faq_whatifres2_content_9")}
          </p>
        </div>

        <div>
          <h3 id="ressrc" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            {t("faq_Whathappensifaresolutionsourceisnolongeravailable?")}
          </h3>
          <p>
            {t("faq_ressrc_content_1")}
            <em>{t("faq_ressrc_content_2")}</em>
            {t("faq_ressrc_content_3")}
          </p>
          <p>{t("faq_ressrc_content_4")}</p>
        </div>

        <div>
          <h3
            id="rescouncil"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatareResolutionCouncils?")}
          </h3>
          <p>{t("faq_rescouncil_content_1")}</p>
          <p>{t("faq_rescouncil_content_2")}</p>
          <p>{t("faq_rescouncil_content_3")}</p>
        </div>
        <hr />
        <div>
          <h2
            id="predictions"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            {t("faq_Predictions")}
          </h2>
        </div>

        <div>
          <h3
            id="tutorial"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Isthereatutorialorwalkthrough?")}
          </h3>
          <p>
            {t("faq_tutorial_content_1")}
            <a href="/tutorials/">{t("faq_tutorial_content_2")}</a>.
          </p>
        </div>

        <div>
          <h3
            id="howpredict"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_HowdoImakeaprediction?CanIchangeitlater?")}
          </h3>
          <p>{t("faq_howpredict_content_1")}</p>
          <p>{t("faq_howpredict_content_2")}</p>
        </div>
        <div>
          <h3
            id="howwithdraw"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_HowcanIwithdrawmyprediction?")}
          </h3>
          <p>{t("faq_howwithdraw_content_1")}</p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/withdraw_button.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={700}
            height={400}
          />
          <p>{t("faq_howwithdraw_content_2")}</p>
          <p>
            <ul className="list-disc pl-5">
              <li>{t("faq_howwithdraw_content_3")}</li>
              <li>{t("faq_howwithdraw_content_4")}</li>
              <li>{t("faq_howwithdraw_content_5")}</li>
            </ul>
          </p>
          <p>{t("faq_howwithdraw_content_6")}</p>
          <p>{t("faq_howwithdraw_content_7")}</p>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  day
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  3
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  4
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  5
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Alex
                </td>
                {[80, 80, 80, 80, 80].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey
                </td>
                {[60, 60, 60, null, null].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage ? `${percentage}%` : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Cedar
                </td>
                {[null, 20, 20, 20, 20].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage ? `${percentage}%` : ""}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Community Prediction
                </td>
                {[70, 60, 60, 50, 50].map((percentage, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    {percentage}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <p>{t("faq_howwithdraw_content_17")}</p>
          <p>{t("faq_howwithdraw_content_18")}</p>

          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  day
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  3
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  4
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  5
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Alex
                </td>
                {[
                  { baseline: "+14", peer: "+6", coverage: "0.2" },
                  { baseline: "+14", peer: "+17", coverage: "0.2" },
                  { baseline: "+14", peer: "+17", coverage: "0.2" },
                  { baseline: "+14", peer: "+28", coverage: "0.2" },
                  { baseline: "+14", peer: "+28", coverage: "0.2" },
                  { baseline: "+70", peer: "+96", coverage: "1.0" },
                ].map((data, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    <div className="flex flex-col gap-1">
                      <div>Baseline: {data.baseline}</div>
                      <div>Peer: {data.peer}</div>
                      <div>Coverage: {data.coverage}</div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey
                </td>
                {[
                  { baseline: "+5", peer: "-6", coverage: "0.2" },
                  { baseline: "+5", peer: "+8", coverage: "0.2" },
                  { baseline: "+5", peer: "+8", coverage: "0.2" },
                  { baseline: "0", peer: "0", coverage: "0" },
                  { baseline: "0", peer: "0", coverage: "0" },
                  { baseline: "+15", peer: "+10", coverage: "0.6" },
                ].map((data, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    <div className="flex flex-col gap-1">
                      <div>Baseline: {data.baseline}</div>
                      <div>Peer: {data.peer}</div>
                      <div>Coverage: {data.coverage}</div>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Cedar
                </td>
                {[
                  { baseline: "0", peer: "0", coverage: "0" },
                  { baseline: "-17", peer: "-25", coverage: "0.2" },
                  { baseline: "-17", peer: "-25", coverage: "0.2" },
                  { baseline: "-17", peer: "-28", coverage: "0.2" },
                  { baseline: "-17", peer: "-28", coverage: "0.2" },
                  { baseline: "-68", peer: "-106", coverage: "0.8" },
                ].map((data, i) => (
                  <td
                    key={i}
                    className="border border-gray-300 p-2 dark:border-gray-300-dark"
                  >
                    <div className="flex flex-col gap-1">
                      <div>Baseline: {data.baseline}</div>
                      <div>Peer: {data.peer}</div>
                      <div>Coverage: {data.coverage}</div>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <p>{t("faq_howwithdraw_content_33")}</p>
          <p>{t("faq_howwithdraw_content_34")}</p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/search_filters.jpg"
            alt="Search Filters"
            className="my-4"
            width={700}
            height={500}
          />
          <p>{t("faq_howwithdraw_content_35")}</p>
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/timeline_withdraw.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={300}
            height={300}
          />
        </div>
        <div>
          <h3
            id="range-interface"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_HowdoIusetherangeinterface?")}
          </h3>
          <p>
            {t("faq_range-interface_content_1")}
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              {t("faq_range-interface_content_2")}
            </a>
            {t("faq_range-interface_content_3")}
          </p>

          <p>{t("faq_range-interface_content_4")}</p>
          <Image
            src="https://raw.githubusercontent.com/ryooan/faq/main/static/img/interface.png"
            alt="Prediction Interface"
            className="my-4"
            width={769}
            height={773}
          />
          <p>
            {t("faq_range-interface_content_5")}
            <a href="https://en.wikipedia.org/wiki/Cumulative_distribution_function">
              {t("faq_range-interface_content_6")}
            </a>
            {t("faq_range-interface_content_7")}
          </p>
          <Image
            src="https://raw.githubusercontent.com/ryooan/faq/main/static/img/cumulative.png"
            alt="Cumulative Interface"
            className="my-4"
            width={771}
            height={776}
          />
          <p>{t("faq_range-interface_content_8")}</p>
        </div>

        <div>
          <h4
            id="out-of-bounds-resolution"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            {t("faq_OutofBoundsResolution")}
          </h4>
          <p>{t("faq_out-of-bounds-resolution_content_1")}</p>
          <p>{t("faq_out-of-bounds-resolution_content_2")}</p>
        </div>

        <div>
          <h4
            id="closed-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            {t("faq_ClosedBoundaries")}
          </h4>
          <p>{t("faq_closed-boundaries_content_1")}</p>
        </div>

        <div>
          <h4
            id="open-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            {t("faq_OpenBoundaries")}
          </h4>
          <p>{t("faq_open-boundaries_content_1")}</p>
          <p>{t("faq_open-boundaries_content_2")}</p>
        </div>

        <div>
          <h4
            id="multiple-components"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            {t("faq_MultipleComponents")}
          </h4>
          <p>{t("faq_multiple-components_content_1")}</p>
        </div>

        <div>
          <h3
            id="community-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_HowistheCommunityPredictioncalculated?")}
          </h3>
          <p>{t("faq_community-prediction_content_1")}</p>
          <p>{t("faq_community-prediction_content_2")}</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>{t("faq_community-prediction_content_3")}</li>
            <li>
              {t("faq_community-prediction_content_4")}
              <KatexRenderer equation="n" inline />
              {t("faq_community-prediction_content_5")}
              <KatexRenderer equation="1" inline />
              ).
            </li>
            <li>
              {t("faq_community-prediction_content_6")}
              <KatexRenderer equation="w(n) \propto e^{\sqrt{n}}" inline />
              {t("faq_community-prediction_content_7")}
            </li>
            <ul className="ml-5 list-disc">
              <li>
                {t("faq_community-prediction_content_8")}
                <a href="/faq/#question-types">
                  {t("faq_community-prediction_content_9")}
                </a>
                {t("faq_community-prediction_content_10")}
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  {t("faq_community-prediction_content_11")}
                </a>
                {t("faq_community-prediction_content_12")}
              </li>
              <li>
                {t("faq_community-prediction_content_13")}
                <a href="/faq/#question-types">
                  {t("faq_community-prediction_content_14")}
                </a>
                {t("faq_community-prediction_content_15")}
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  {t("faq_community-prediction_content_16")}
                </a>
                {t("faq_community-prediction_content_17")}
                <KatexRenderer equation="[0.001, 0.999]" inline />.
              </li>
              <li>
                {t("faq_community-prediction_content_18")}
                <a href="/faq/#question-types">
                  {t("faq_community-prediction_content_19")}
                </a>
                {t("faq_community-prediction_content_20")}
                <a href="https://en.wikipedia.org/wiki/Mixture_distribution">
                  {t("faq_community-prediction_content_21")}
                </a>
                {t("faq_community-prediction_content_22")}
              </li>
            </ul>
            <li>
              {t("faq_community-prediction_content_23")}
              <KatexRenderer equation="\sqrt{N}" inline />
              {t("faq_community-prediction_content_24")}
              <KatexRenderer equation="N" inline />
              {t("faq_community-prediction_content_25")}
            </li>
          </ul>
          <p>{t("faq_community-prediction_content_26")}</p>
          <h4
            id="include-bots"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            {t("faq_ArebotsincludedintheCommunityPrediction?")}
          </h4>
          <p>{t("faq_include-bots_content_1")}</p>
        </div>

        <div>
          <h3
            id="metaculus-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatistheMetaculusPrediction?")}
          </h3>
          <p>
            {t("faq_metaculus-prediction_content_1")}
            <a href="/aggregation-explorer/">
              {t("faq_metaculus-prediction_content_2")}
            </a>
            {t("faq_metaculus-prediction_content_3")}
          </p>
          <p>{t("faq_metaculus-prediction_content_4")}</p>
        </div>
        <hr />
        <div>
          <h2
            id="visibility-of-the-cp-and-mp"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            {t("faq_WhycantIseetheCP?")}
          </h2>
          <p>{t("faq_visibility-of-the-cp-and-mp_content_1")}</p>
        </div>

        <div>
          <h3
            id="public-figure"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatArePublicFigurePredictions?")}
          </h3>
          <p>
            <a href="/organization/public-figures/">
              {t("faq_public-figure_content_1")}
            </a>
            {t("faq_public-figure_content_2")}
          </p>
          <p>
            {t("faq_public-figure_content_3")}
            <em>{t("faq_public-figure_content_4")}</em>
            {t("faq_public-figure_content_5")}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_6")}
          </h4>
          <p>{t("faq_public-figure_content_7")}</p>
          <p>{t("faq_public-figure_content_8")}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_9")}
          </h4>
          <p>{t("faq_public-figure_content_10")}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_11")}
          </h4>
          <p>{t("faq_public-figure_content_12")}</p>
          <ol className="ml-5 list-inside list-decimal">
            <li>{t("faq_public-figure_content_13")}</li>
            <li>{t("faq_public-figure_content_14")}</li>
            <li>{t("faq_public-figure_content_15")}</li>
            <li>{t("faq_public-figure_content_16")}</li>
            <li>{t("faq_public-figure_content_17")}</li>
          </ol>
          <p>
            {t("faq_public-figure_content_18")}
            <a
              href="/questions/8198/public-figure-predictions/"
              target="_blank"
              rel="noopener"
            >
              {t("faq_public-figure_content_19")}
            </a>
            {t("faq_public-figure_content_20")}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_21")}
          </h4>
          <p>
            {t("faq_public-figure_content_22")}
            <a
              href="/questions/8225/public-figure-prediction-by-joe-biden/"
              target="_blank"
              rel="noopener"
            >
              {t("faq_public-figure_content_23")}
            </a>
            .{" "}
            <a
              href="/questions/6438/will-joe-biden-run-for-reelection/"
              target="_blank"
              rel="noopener"
            >
              {t("faq_public-figure_content_24")}
            </a>
            {t("faq_public-figure_content_25")}
          </p>
          <p>
            {t("faq_public-figure_content_26")}
            <a
              href="/questions/5712/biden-2024-re-nomination/"
              target="_blank"
              rel="noopener"
            >
              {t("faq_public-figure_content_27")}
            </a>
            {t("faq_public-figure_content_28")}
          </p>
          <p>
            {t("faq_public-figure_content_29")}
            <a
              href="/questions/8523/irs-designates-crypto-miners-brokers-by-2025/"
              target="_blank"
              rel="noopener"
            >
              {t("faq_public-figure_content_30")}
            </a>
            {t("faq_public-figure_content_31")}
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_32")}
          </h4>
          <p>{t("faq_public-figure_content_33")}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_34")}
          </h4>
          <p>{t("faq_public-figure_content_35")}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_36")}
          </h4>
          <p>{t("faq_public-figure_content_37")}</p>
        </div>

        <div>
          <h4 className="mb-4 text-xl font-semibold">
            {t("faq_public-figure_content_38")}
          </h4>
          <p>{t("faq_public-figure_content_39")}</p>
        </div>

        <div>
          <h3
            id="reaffirming"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t('faq_Whatis"Reaffirming"aprediction?')}
          </h3>
          <p>{t("faq_reaffirming_content_1")}</p>
          <p>{t("faq_reaffirming_content_2")}</p>
          <p>{t("faq_reaffirming_content_3")}</p>
          <Image
            src="https://metaculus-public.s3.us-west-2.amazonaws.com/Screen+Shot+2023-02-14+at+2.14.38+PM.png"
            alt="Reaffirming a prediction"
            className="my-4"
            width={922}
            height={575}
          />

          <p>{t("faq_reaffirming_content_4")}</p>
        </div>
        <hr />
        <div>
          <h2
            id="scores-and-medals"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            {t("faq_ScoresandMedals")}
          </h2>

          <h3
            id="whatscores"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Whatarescores?")}
          </h3>
          <p>{t("faq_whatscores_content_1")}</p>
          <p>
            {t("faq_whatscores_content_2")}
            <a href="/help/scores-faq/">{t("faq_whatscores_content_3")}</a>.
          </p>

          <h3
            id="whatmedals"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Whataremedals?")}
          </h3>
          <p>{t("faq_whatmedals_content_1")}</p>
          <p>
            {t("faq_whatmedals_content_2")}
            <a href="/help/medals-faq/">{t("faq_whatmedals_content_3")}</a>.
          </p>
        </div>

        <hr />
        <div>
          <h2
            id="Metaculus Journal"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            {t("faq_MetaculusJournal")}
          </h2>

          <h3
            id="whatisjournal"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatistheMetaculusJournal?")}
          </h3>
          <p>
            {t("faq_whatisjournal_content_1")}
            <a href="/project/journal/">{t("faq_whatisjournal_content_2")}</a>
            {t("faq_whatisjournal_content_3")}
          </p>
          <p>
            {t("faq_whatisjournal_content_4")}
            <a href="mailto:christian@metaculus.com">
              {t("faq_whatisjournal_content_5")}
            </a>
            {t("faq_whatisjournal_content_6")}
          </p>

          <h3
            id="fortifiedessay"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Whatisafortifiedessay?")}
          </h3>
          <p>{t("faq_fortifiedessay_content_1")}</p>
          <p>{t("faq_fortifiedessay_content_2")}</p>
        </div>
        <hr />
        <div>
          <h2 id="miscellany" className="mb-4 scroll-mt-nav text-3xl font-bold">
            {t("faq_Miscellany")}
          </h2>

          <h3
            id="what-are-pros"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatareMetaculusProForecasters?")}
          </h3>
          <p>
            {t("faq_what-are-pros_content_1")}
            <Link href={"/pro-forecasters"}>
              {t("faq_what-are-pros_content_2")}
            </Link>
            {t("faq_what-are-pros_content_3")}
          </p>
          <p>
            {t("faq_what-are-pros_content_4")}
            <a href="mailto:support@metaculus.com">
              {t("faq_what-are-pros_content_5")}
            </a>
            {t("faq_what-are-pros_content_6")}
          </p>
          <p>{t("faq_what-are-pros_content_7")}</p>
          <ol className="ml-5 list-inside list-decimal">
            <li>{t("faq_what-are-pros_content_8")}</li>
            <li>{t("faq_what-are-pros_content_9")}</li>
            <li>{t("faq_what-are-pros_content_10")}</li>
            <li>{t("faq_what-are-pros_content_11")}</li>
            <li>{t("faq_what-are-pros_content_12")}</li>
          </ol>

          <h3 id="api" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            {t("faq_DoesMetaculushaveanAPI?")}
          </h3>
          <p>{t("faq_api_content_1")}</p>

          <h3
            id="change-name"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_HowdoIchangemyusername?")}
          </h3>
          <p>{t("faq_change-name_content_1")}</p>

          <h3
            id="cant-comment"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Imregistered.WhycantIcommentonaquestion?")}
          </h3>
          <p>{t("faq_cant-comment_content_1")}</p>

          <h3
            id="suspensions"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_Understandingaccountsuspensions.")}
          </h3>
          <p>
            {t("faq_suspensions_content_1")}
            <a href="/terms-of-use/">{t("faq_suspensions_content_2")}</a>
            {t("faq_suspensions_content_3")}
          </p>

          <h3
            id="cant-see"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t(
              "faq_WhycanIseetheCommunityPredictiononsomequestions,theMetaculusPredictiononothers,andnopredictiononsomeothers?"
            )}
          </h3>
          <p>{t("faq_cant-see_content_1")}</p>
        </div>
        <div>
          <h3
            id="related-news"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatisNewsMatch?")}
          </h3>
          <p>{t("faq_related-news_content_1")}</p>
          <p>
            {t("faq_related-news_content_2")}
            <a href="https://www.improvethenews.org/">
              {t("faq_related-news_content_3")}
            </a>
            {t("faq_related-news_content_4")}
          </p>
          <p>
            {t("faq_related-news_content_5")}
            <a href="https://arxiv.org/abs/2004.09297">
              {t("faq_related-news_content_6")}
            </a>
            .
          </p>
        </div>

        <div>
          <h3
            id="community-insights"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_WhatareCommunityInsights?")}
          </h3>
          <p>{t("faq_community-insights_content_1")}</p>
          <p>
            {t("faq_community-insights_content_2")}
            <a href="mailto:support@metaculus.com">
              {t("faq_community-insights_content_3")}
            </a>
            .
          </p>
          <p>{t("faq_community-insights_content_4")}</p>
        </div>

        <div>
          <h3
            id="domains"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_CanIgetmyownMetaculus?")}
          </h3>
          <p>{t("faq_domains_content_1")}</p>
        </div>

        <div>
          <h3
            id="spreadword"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_HowcanIhelpspreadthewordaboutMetaculus?")}
          </h3>
          <p>{t("faq_spreadword_content_1")}</p>
          <ol className="ml-5 list-decimal">
            <li>{t("faq_spreadword_content_2")}</li>
            <li>
              <a href="https://www.twitter.com/metaculus/">
                {t("faq_spreadword_content_3")}
              </a>
              {t("faq_spreadword_content_4")}
            </li>
            <li>
              <a href="https://www.facebook.com/metaculus/">
                {t("faq_spreadword_content_5")}
              </a>
              {t("faq_spreadword_content_6")}
            </li>
            <li>
              <a href="mailto:support@metaculus.com">
                {t("faq_spreadword_content_7")}
              </a>
              {t("faq_spreadword_content_8")}
            </li>
          </ol>
        </div>

        <div>
          <h3
            id="closeaccount"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            {t("faq_CanIclosemyMetaculusaccountanddeletemyinformation?")}
          </h3>
          <p>
            {t("faq_closeaccount_content_1")}
            <a href="mailto:closemyaccount@metaculus.com">
              {t("faq_closeaccount_content_2")}
            </a>
            {t("faq_closeaccount_content_3")}
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
