import { useTranslations } from "next-intl";

import KatexRenderer from "@/components/katex_renderer";

import BaselineMath from "./components/baseline_math";
import FurtherMath from "./components/further_math";
import PeerMath from "./components/peer_math";
import PointsMath from "./components/points_math";
import TruncationExample from "./components/truncation_example";
import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Scores FAQ | Metaculus",
  description:
    "Learn how Metaculus scores work, including Peer scores, Relative scores, and legacy scoring methods. Understand tournament rankings, coverage, and prize calculations.",
};

export default function ScoresFAQ() {
  const t = useTranslations();
  return (
    <PageWrapper>
      <h1>{t("scores-faq_ScoresFAQ")}</h1>
      <p>
        {t("scores-faq__content_1")}
        <a href="/faq/">{t("scores-faq__content_2")}</a>
        {t("scores-faq__content_3")}
        <a href="/help/medals-faq/">{t("scores-faq__content_4")}</a>.
      </p>

      <div className="table-of-contents">
        <ul className="space-y-2">
          <li className="font-bold">
            <a href="#scores-section">{t("scores-faq__content_5")}</a>
          </li>
          <ul className=" space-y-1 pl-4">
            <li>
              <a href="#scoring-rule">{t("scores-faq__content_6")}</a>
            </li>
            <li>
              <a href="#proper-scoring">{t("scores-faq__content_7")}</a>
            </li>
            <li>
              <a href="#log-score">{t("scores-faq__content_8")}</a>
            </li>
            <li>
              <a href="#continuous-log-score">{t("scores-faq__content_9")}</a>
            </li>
            <li>
              <a href="#spot-score">{t("scores-faq__content_10")}</a>
            </li>
            <li>
              <a href="#baseline-score">{t("scores-faq__content_11")}</a>
            </li>
            <li>
              <a href="#peer-score">{t("scores-faq__content_12")}</a>
            </li>
            <li>
              <a href="#cp-positive-peer">{t("scores-faq__content_13")}</a>
            </li>
            <li>
              <a href="#time-averaging">{t("scores-faq__content_14")}</a>
            </li>
            <li>
              <a href="#extremizing">{t("scores-faq__content_15")}</a>
            </li>
            <li>
              <a href="#score-truncation">{t("scores-faq__content_16")}</a>
            </li>
            <li>
              <a href="#legacy-scores">{t("scores-faq__content_17")}</a>
              <ul className="space-y-1  pl-4 pt-2">
                <li>
                  <a href="#relative-score">{t("scores-faq__content_18")}</a>
                </li>
                <li>
                  <a href="#coverage">{t("scores-faq__content_19")}</a>
                </li>
                <li>
                  <a href="#old-points">{t("scores-faq__content_20")}</a>
                </li>
              </ul>
            </li>
          </ul>
          <li className="font-bold">
            <a href="#tournaments-section">{t("scores-faq__content_21")}</a>
          </li>
          <ul className="space-y-1 pl-4">
            <li>
              <a href="#tournament-scores">{t("scores-faq__content_22")}</a>
            </li>
            <li>
              <a href="#legacy-tournament-scores">
                {t("scores-faq__content_23")}
              </a>
            </li>
            <li>
              <a href="#hidden-period">{t("scores-faq__content_24")}</a>
            </li>
          </ul>
        </ul>
      </div>

      <hr className="my-8" />

      <h1 className="scroll-mt-nav" id="scores-section">
        {t("scores-faq_Scores")}
      </h1>

      <hr />
      <h2 className="scroll-mt-nav" id="scoring-rule">
        {t("scores-faq_Whatisascoringrule?")}
      </h2>
      <p>{t("scores-faq_scoring-rule_content_1")}</p>
      <p>{t("scores-faq_scoring-rule_content_2")}</p>
      <p>{t("scores-faq_scoring-rule_content_3")}</p>

      <hr />
      <h2 className="scroll-mt-nav" id="proper-scoring">
        {t("scores-faq_Whatisaproperscoringrule?")}
      </h2>
      <p>{t("scores-faq_proper-scoring_content_1")}</p>
      <p>{t("scores-faq_proper-scoring_content_2")}</p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-xs font-bold md:text-sm">
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_3")}
              </td>
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_4")}
              </td>
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_5")}
              </td>
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_6")}
              </td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">1</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">2</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">3</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">4</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">5</td>
              <td className="p-3">0.95</td>
              <td className="p-3">0.83</td>
              <td className="p-3">0.7</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">6</td>
              <td className="p-3">0.05</td>
              <td className="p-3">0.17</td>
              <td className="p-3">0.3</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_7")}
              </td>
              <td className="p-3">0.8</td>
              <td className="p-3">0.72</td>
              <td className="p-3">0.63</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>{t("scores-faq_proper-scoring_content_8")}</p>
      <p>
        {t("scores-faq_proper-scoring_content_9")}
        <a href="/help/scores-faq/#log-score">
          {t("scores-faq_proper-scoring_content_10")}
        </a>
        {t("scores-faq_proper-scoring_content_11")}
      </p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-xs font-bold  md:text-sm">
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_12")}
              </td>
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_13")}
              </td>
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_14")}
              </td>
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_15")}
              </td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">1</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">2</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">3</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">4</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">5</td>
              <td className="p-3">-0.05</td>
              <td className="p-3">-0.19</td>
              <td className="p-3">-0.37</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">6</td>
              <td className="p-3">-3</td>
              <td className="p-3">-1.77</td>
              <td className="p-3">-1.2</td>
            </tr>
            <tr className="text-xs font-normal md:text-sm">
              <td className="p-3">
                {t("scores-faq_proper-scoring_content_16")}
              </td>
              <td className="p-3">-0.54</td>
              <td className="p-3">-0.45</td>
              <td className="p-3">-0.51</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>{t("scores-faq_proper-scoring_content_17")}</p>
      <hr />
      <h2 className="scroll-mt-nav" id="log-score">
        {t("scores-faq_Whatisthelogscore?")}
      </h2>
      <p>{t("scores-faq_log-score_content_1")}</p>
      <KatexRenderer
        equation="\text{log score} = \ln(P(outcome))"
        inline={false}
      />
      <p>
        {t("scores-faq_log-score_content_2")}
        <KatexRenderer equation="\ln" inline />
        {t("scores-faq_log-score_content_3")}
        <KatexRenderer equation="P(outcome)" inline />
        {t("scores-faq_log-score_content_4")}
      </p>
      <p>{t("scores-faq_log-score_content_5")}</p>
      <ul className="ml-6 list-disc">
        <li>
          {t("scores-faq_log-score_content_6")}
          <KatexRenderer equation={`-\\infty`} inline />
          {t("scores-faq_log-score_content_7")}
        </li>
        <li>{t("scores-faq_log-score_content_8")}</li>
      </ul>
      <p>
        {t("scores-faq_log-score_content_9")}
        <a href="/help/scores-faq/#baseline-score">
          {t("scores-faq_log-score_content_10")}
        </a>
        {t("scores-faq_log-score_content_11")}
        <a href="/help/scores-faq/#peer-score">
          {t("scores-faq_log-score_content_12")}
        </a>
        {t("scores-faq_log-score_content_13")}
      </p>
      <p>
        {t("scores-faq_log-score_content_14")}
        <a href="/help/scores-faq/#proper-scoring">
          {t("scores-faq_log-score_content_15")}
        </a>
        {t("scores-faq_log-score_content_16")}
        <b>{t("scores-faq_log-score_content_17")}</b>
        {t("scores-faq_log-score_content_18")}
        <a href="#extremizing">{t("scores-faq_log-score_content_19")}</a>
        ).
      </p>
      <p>{t("scores-faq_log-score_content_20")}</p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-xs font-bold md:text-sm">
              <td className="p-2"></td>
              <td className="p-2">{t("scores-faq_log-score_content_21")}</td>
              <td className="p-2">{t("scores-faq_log-score_content_22")}</td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs font-light md:text-sm">
              <td className="p-2">{t("scores-faq_log-score_content_23")}</td>
              <td className="p-2">-0.01</td>
              <td className="p-2">-0.001</td>
            </tr>
            <tr className="text-xs font-light md:text-sm">
              <td className="p-2">{t("scores-faq_log-score_content_24")}</td>
              <td className="p-2">-4.6</td>
              <td className="p-2">-6.9</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>{t("scores-faq_log-score_content_25")}</p>

      <hr />
      <h2 className="scroll-mt-nav" id="continuous-log-score">
        {t("scores-faq_Whatisthelogscoreforcontinuousquestions?")}
      </h2>
      <p>{t("scores-faq_continuous-log-score_content_1")}</p>
      <KatexRenderer
        equation="\text{log score} = \ln(\operatorname{pdf}(outcome))"
        inline={false}
      />
      <p>
        {t("scores-faq_continuous-log-score_content_2")}
        <KatexRenderer equation="\ln" inline />
        {t("scores-faq_continuous-log-score_content_3")}
        <KatexRenderer equation="\operatorname{pdf}(outcome)" inline />
        {t("scores-faq_continuous-log-score_content_4")}
        <a href="https://en.wikipedia.org/wiki/Probability_density_function">
          {t("scores-faq_continuous-log-score_content_5")}
        </a>
        {t("scores-faq_continuous-log-score_content_6")}
        <a href="https://en.wikipedia.org/wiki/Uniform_distribution">
          {t("scores-faq_continuous-log-score_content_7")}
        </a>
        {t("scores-faq_continuous-log-score_content_8")}
      </p>
      <p>
        {t("scores-faq_continuous-log-score_content_9")}
        <KatexRenderer equation="\operatorname{pdf}" inline />
        {t("scores-faq_continuous-log-score_content_10")}
      </p>
      <hr />
      <h2 className="scroll-mt-nav" id="spot-score">
        {t("scores-faq_Whatisaspotscore?")}
      </h2>
      <p>{t("scores-faq_spot-score_content_1")}</p>
      <hr />
      <h2 className="scroll-mt-nav" id="baseline-score">
        {t("scores-faq_WhatistheBaselinescore?")}
      </h2>
      <p>{t("scores-faq_baseline-score_content_1")}</p>
      <p>{t("scores-faq_baseline-score_content_2")}</p>
      <p>
        {t("scores-faq_baseline-score_content_3")}
        <a href="/help/scores-faq/#log-score">
          {t("scores-faq_baseline-score_content_4")}
        </a>
        {t("scores-faq_baseline-score_content_5")}
      </p>
      <ul className="list-disc pl-5">
        <li>{t("scores-faq_baseline-score_content_6")}</li>
        <li>{t("scores-faq_baseline-score_content_7")}</li>
        <li>{t("scores-faq_baseline-score_content_8")}</li>
      </ul>
      <p>{t("scores-faq_baseline-score_content_9")}</p>
      <div className="overflow-x-auto">
        <table className="mx-auto w-auto">
          <thead>
            <tr>
              <th className="p-4 text-xs font-bold  md:text-sm"></th>
              <th className="p-4 text-xs font-bold  md:text-sm">
                {t("scores-faq_baseline-score_content_10")}
              </th>
              <th className="p-4 text-xs font-bold  md:text-sm">
                {t("scores-faq_baseline-score_content_11")}
                <br />
                {t("scores-faq_baseline-score_content_12")}
              </th>
              <th className="p-4 text-xs font-bold  md:text-sm">
                {t("scores-faq_baseline-score_content_13")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                {t("scores-faq_baseline-score_content_14")}
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+99.9</td>
              <td className="p-4 text-xs font-light md:text-sm">+99.9</td>
              <td className="p-4 text-xs font-light md:text-sm">+183</td>
            </tr>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                {t("scores-faq_baseline-score_content_15")}
              </td>
              <td className="p-4 text-xs font-light md:text-sm">-897</td>
              <td className="p-4 text-xs font-light md:text-sm">-232</td>
              <td className="p-4 text-xs font-light md:text-sm">-230</td>
            </tr>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                {t("scores-faq_baseline-score_content_16")}
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+17</td>
              <td className="p-4 text-xs font-light md:text-sm">
                {t("scores-faq_baseline-score_content_17")}
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+14</td>
            </tr>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                {t("scores-faq_baseline-score_content_18")}
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+13</td>
              <td className="p-4 text-xs font-light md:text-sm">
                {t("scores-faq_baseline-score_content_19")}
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+13</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>{t("scores-faq_baseline-score_content_20")}</p>
      <p>
        {t("scores-faq_baseline-score_content_21")}
        <a href="/help/scores-faq/#time-averaging">
          {t("scores-faq_baseline-score_content_22")}
        </a>
        .
      </p>
      <p>{t("scores-faq_baseline-score_content_23")}</p>
      <BaselineMath />
      <hr />
      <h2 className="scroll-mt-nav" id="peer-score">
        {t("scores-faq_WhatisthePeerscore?")}
      </h2>
      <p>{t("scores-faq_peer-score_content_1")}</p>
      <p>
        {t("scores-faq_peer-score_content_2")}
        <a href="/help/scores-faq/#log-score">
          {t("scores-faq_peer-score_content_3")}
        </a>
        {t("scores-faq_peer-score_content_4")}
      </p>
      <p>
        {t("scores-faq_peer-score_content_5")}
        <a href="/help/scores-faq/#continuous-log-score">
          {t("scores-faq_peer-score_content_6")}
        </a>
        {t("scores-faq_peer-score_content_7")}
      </p>
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_peer-score_content_8")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_peer-score_content_9")}
              </th>
              <th className="px-4 py-2  text-left text-xs font-bold md:text-sm">
                {t("scores-faq_peer-score_content_10")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                {t("scores-faq_peer-score_content_11")}
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                <KatexRenderer equation="-1" inline />
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                <KatexRenderer
                  equation="\frac{(A-B)+(A-C)}{2} = \frac{(-1-1)+(-1-2)}{2} = -2.5"
                  inline={false}
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                {t("scores-faq_peer-score_content_12")}
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                <KatexRenderer equation="1" inline />
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                <KatexRenderer
                  equation="\frac{(B-A)+(B-C)}{2} = \frac{(1-(-1))+(1-2)}{2} = 0.5"
                  inline={false}
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                {t("scores-faq_peer-score_content_13")}
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                <KatexRenderer equation="2" inline />
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                <KatexRenderer
                  equation="\frac{(C-A)+(C-B)}{2} = \frac{(2-(-1))+(2-1)}{2} = 2"
                  inline={false}
                />
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                {t("scores-faq_peer-score_content_14")}
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                <KatexRenderer equation="-2.5+0.5+2 = 0" inline={false} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>{t("scores-faq_peer-score_content_15")}</p>
      <table className="mx-auto table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2  text-xs font-bold md:text-sm"></th>
            <th className="px-4 py-2  text-xs font-bold md:text-sm">
              {t("scores-faq_peer-score_content_16")}
              <br />
              {t("scores-faq_peer-score_content_17")}
              <br />
              {t("scores-faq_peer-score_content_18")}
            </th>
            <th className="px-4 py-2  text-xs font-bold md:text-sm">
              {t("scores-faq_peer-score_content_19")}
              <br />
              {t("scores-faq_peer-score_content_20")}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2 text-xs font-light md:text-sm">
              {t("scores-faq_peer-score_content_21")}
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              +996
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              +408
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-xs font-light md:text-sm">
              {t("scores-faq_peer-score_content_22")}
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              -996
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              -408
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-xs font-light md:text-sm">
              {t("scores-faq_peer-score_content_23")}
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              +2
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              +3
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 text-xs font-light md:text-sm">
              {t("scores-faq_peer-score_content_24")}
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              0*
            </td>
            <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
              0*
            </td>
          </tr>
        </tbody>
      </table>
      <p>{t("scores-faq_peer-score_content_25")}</p>
      <p>{t("scores-faq_peer-score_content_26")}</p>
      <p>{t("scores-faq_peer-score_content_27")}</p>
      <p>
        {t("scores-faq_peer-score_content_28")}
        <a href="/help/scores-faq/#time-averaging">
          {t("scores-faq_peer-score_content_29")}
        </a>
        .
      </p>
      <p>{t("scores-faq_peer-score_content_30")}</p>
      <PeerMath />

      <hr />
      <h2 className="scroll-mt-nav" id="cp-positive-peer">
        {t("scores-faq_WhyisthePeerscoreoftheCommunityPredictionpositive?")}
      </h2>
      <p>
        {t("scores-faq_cp-positive-peer_content_1")}
        <a href="/help/scores-faq/#peer-score">
          {t("scores-faq_cp-positive-peer_content_2")}
        </a>
        {t("scores-faq_cp-positive-peer_content_3")}
        <a href="/help/scores-faq/#log-score">
          {t("scores-faq_cp-positive-peer_content_4")}
        </a>
        {t("scores-faq_cp-positive-peer_content_5")}
      </p>
      <p>
        {t("scores-faq_cp-positive-peer_content_6")}
        <a href="/faq/#community-prediction">
          {t("scores-faq_cp-positive-peer_content_7")}
        </a>
        {t("scores-faq_cp-positive-peer_content_8")}
      </p>
      <p>{t("scores-faq_cp-positive-peer_content_9")}</p>
      <FurtherMath />

      <hr />
      <h2 className="scroll-mt-nav" id="time-averaging">
        {t("scores-faq_Doallmypredictionsonaquestioncounttowardmyscore?")}
      </h2>
      <p>{t("scores-faq_time-averaging_content_1")}</p>
      <p>{t("scores-faq_time-averaging_content_2")}</p>
      <div className="w-full overflow-x-auto overflow-y-hidden">
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm"></th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_time-averaging_content_3")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_time-averaging_content_4")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_time-averaging_content_5")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_time-averaging_content_6")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_time-averaging_content_7")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_time-averaging_content_8")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                {t("scores-faq_time-averaging_content_9")}
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">40%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">70%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">80%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                {t("scores-faq_time-averaging_content_10")}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                {t("scores-faq_time-averaging_content_11")}
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">0</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">-32</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+49</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+49</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+68</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+27</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>{t("scores-faq_time-averaging_content_12")}</p>
      <ul className="ml-5 list-disc">
        <li>{t("scores-faq_time-averaging_content_13")}</li>
        <li>{t("scores-faq_time-averaging_content_14")}</li>
        <li>{t("scores-faq_time-averaging_content_15")}</li>
      </ul>

      <p>
        {t("scores-faq_time-averaging_content_16")}
        <a href="/help/scores-faq/#score-truncation">
          {t("scores-faq_time-averaging_content_17")}
        </a>
        {t("scores-faq_time-averaging_content_18")}
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="extremizing">
        {t("scores-faq_CanIgetbetterscoresbypredictingextremevalues?")}
      </h2>
      <p>
        {t("scores-faq_extremizing_content_1")}
        <a href="/help/scores-faq/#proper-scoring">
          {t("scores-faq_extremizing_content_2")}
        </a>
        {t("scores-faq_extremizing_content_3")}
      </p>
      <p>{t("scores-faq_extremizing_content_4")}</p>
      <p>{t("scores-faq_extremizing_content_5")}</p>
      <p>
        <KatexRenderer
          equation="80\% \times 68 + 20\% \times -132 = +28"
          inline
        />
      </p>
      <p>{t("scores-faq_extremizing_content_6")}</p>
      <p>
        <KatexRenderer
          equation="80\% \times 85 + 20\% \times -232 = +21"
          inline
        />
      </p>
      <p>{t("scores-faq_extremizing_content_7")}</p>
      <p>{t("scores-faq_extremizing_content_8")}</p>
      <div className="w-full overflow-x-auto">
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_extremizing_content_9")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_extremizing_content_10")}
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                {t("scores-faq_extremizing_content_11")}
              </th>
              <th className="px-4 py-2 text-xs font-bold md:text-sm">
                {t("scores-faq_extremizing_content_12")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">70%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+48</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">-74</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+24</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">80%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+68</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">-132</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+28</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">90%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+85</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">-232</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+21</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">99%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">+99</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">-564</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">-34</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>{t("scores-faq_extremizing_content_13")}</p>

      <hr />
      <h2 className="scroll-mt-nav" id="score-truncation">
        {t("scores-faq_WhydidIgetasmallscorewhenIwasright?")}
      </h2>
      <p>{t("scores-faq_score-truncation_content_1")}</p>
      <p>{t("scores-faq_score-truncation_content_2")}</p>
      <p>{t("scores-faq_score-truncation_content_3")}</p>
      <p>{t("scores-faq_score-truncation_content_4")}</p>
      <p>{t("scores-faq_score-truncation_content_5")}</p>

      <TruncationExample />

      <hr />
      <h2 className="scroll-mt-nav" id="legacy-scores">
        {t("scores-faq_Whatarethelegacyscores?")}
      </h2>

      <h3 className="scroll-mt-nav" id="relative-score">
        {t("scores-faq_WhatistheRelativescore?")}
      </h3>
      <p>{t("scores-faq_relative-score_content_1")}</p>
      <p>{t("scores-faq_relative-score_content_2")}</p>
      <KatexRenderer
        equation="\text{Relative score} = \log_2(p) - \log_2(m)"
        inline={false}
      />
      <p>
        {t("scores-faq_relative-score_content_3")}
        <KatexRenderer equation="p" inline />
        {t("scores-faq_relative-score_content_4")}
        <KatexRenderer equation="m" inline />
        {t("scores-faq_relative-score_content_5")}
      </p>
      <p>
        {t("scores-faq_relative-score_content_6")}
        <a href="/help/scores-faq/#peer-score">
          {t("scores-faq_relative-score_content_7")}
        </a>
        {t("scores-faq_relative-score_content_8")}
      </p>

      <h3 className="scroll-mt-nav" id="coverage">
        {t("scores-faq_Whatisthecoverage?")}
      </h3>
      <p>{t("scores-faq_coverage_content_1")}</p>
      <p>{t("scores-faq_coverage_content_2")}</p>
      <p>{t("scores-faq_coverage_content_3")}</p>

      <h3 className="scroll-mt-nav" id="old-points">
        {t("scores-faq_WhatareMetaculuspoints?")}
      </h3>
      <p>{t("scores-faq_old-points_content_1")}</p>
      <p>
        {t("scores-faq_old-points_content_2")}
        <a href="/legacy-points-rankings/">
          {t("scores-faq_old-points_content_3")}
        </a>
        .
      </p>
      <p>{t("scores-faq_old-points_content_4")}</p>
      <p>{t("scores-faq_old-points_content_5")}</p>

      <PointsMath />
      <hr className="mt-8" />
      <h1 className="scroll-mt-nav" id="tournaments-section">
        {t("scores-faq_Tournaments")}
      </h1>

      <hr />
      <h2 className="scroll-mt-nav" id="tournament-scores">
        {t("scores-faq_HowaremytournamentScore,Take,Prize,andRankcalculated?")}
      </h2>
      <p>
        {t("scores-faq_tournament-scores_content_1")}
        <a href="/help/scores-faq/#peer-score">
          {t("scores-faq_tournament-scores_content_2")}
        </a>
        {t("scores-faq_tournament-scores_content_3")}
      </p>
      <p>{t("scores-faq_tournament-scores_content_4")}</p>
      <p>{t("scores-faq_tournament-scores_content_5")}</p>
      <div className="w-full overflow-x-scroll">
        <KatexRenderer
          equation="\text{your total score} = \sum_\text{questions} \text{your peer score} * \text{question weight}"
          inline={false}
        />
        <KatexRenderer
          equation="\text{your take} = \max ( \text{your total score}, 0)^2"
          inline={false}
        />
        <KatexRenderer
          equation="\text{your \% prize} = \frac{\text{your take}}{\sum_\text{all users} \text{user take}}"
          inline={false}
        />
      </div>
      <p>
        {t("scores-faq_tournament-scores_content_6")}
        <a href="https://www.metaculus.com/help/scores-faq/#proper-scoring">
          {t("scores-faq_tournament-scores_content_7")}
        </a>
        {t("scores-faq_tournament-scores_content_8")}
      </p>
      <p>
        {t("scores-faq_tournament-scores_content_9")}
        <b>{t("scores-faq_tournament-scores_content_10")}</b>
        {t("scores-faq_tournament-scores_content_11")}
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="legacy-tournament-scores">
        {t(
          "scores-faq_Howaremy(legacy)tournamentScore,Coverage,Take,Prize,andRankcalculated?"
        )}
      </h2>
      <p>
        <b>{t("scores-faq_legacy-tournament-scores_content_1")}</b>
      </p>
      <p>{t("scores-faq_legacy-tournament-scores_content_2")}</p>
      <p>{t("scores-faq_legacy-tournament-scores_content_3")}</p>
      <p>{t("scores-faq_legacy-tournament-scores_content_4")}</p>
      <KatexRenderer
        equation="\text{Take} = e^\text{Score} \times \text{Coverage}"
        inline={false}
      />
      <p>{t("scores-faq_legacy-tournament-scores_content_5")}</p>
      <p>{t("scores-faq_legacy-tournament-scores_content_6")}</p>
      <p>{t("scores-faq_legacy-tournament-scores_content_7")}</p>

      <hr />
      <h2 className="scroll-mt-nav" id="hidden-period">
        {t("scores-faq_WhataretheHiddenPeriodandHiddenCoverageWeights?")}
      </h2>
      <p>{t("scores-faq_hidden-period_content_1")}</p>
      <p>{t("scores-faq_hidden-period_content_2")}</p>
      <p>{t("scores-faq_hidden-period_content_3")}</p>
    </PageWrapper>
  );
}
