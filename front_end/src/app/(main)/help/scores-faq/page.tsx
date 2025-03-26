import Link from "next/link";
import { getLocale } from "next-intl/server";

import KatexRenderer from "@/components/katex_renderer";

import BaselineMath from "./components/baseline_math";
import FurtherMath from "./components/further_math";
import PeerMath from "./components/peer_math";
import PointsMath from "./components/points_math";
import TruncationExample from "./components/truncation_example";
import content_pt from "./page_pt";
import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Scores FAQ | Metaculus",
  description:
    "Learn how Metaculus scores work, including Peer scores, Relative scores, and legacy scoring methods. Understand tournament rankings, coverage, and prize calculations.",
};

export default async function ScoresFAQ() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }

  return (
    <PageWrapper>
      <h1>Scores FAQ</h1>
      <p>
        Below are Frequently Asked Questions (and answers!) about scores. The
        general FAQ is <Link href="/faq/">here</Link>, and the medals FAQ is{" "}
        <Link href="/help/medals-faq/">here</Link>.
      </p>

      <div className="table-of-contents">
        <ul className="space-y-2">
          <li className="font-bold">
            <a href="#scores-section">Scores</a>
          </li>
          <ul className=" space-y-1 pl-4">
            <li>
              <a href="#scoring-rule">What is a scoring rule?</a>
            </li>
            <li>
              <a href="#proper-scoring">What is a proper scoring rule?</a>
            </li>
            <li>
              <a href="#log-score">What is the log score?</a>
            </li>
            <li>
              <a href="#continuous-log-score">
                What is the log score for continuous questions?
              </a>
            </li>
            <li>
              <a href="#spot-score">What is a spot score?</a>
            </li>
            <li>
              <a href="#baseline-score">What is the Baseline score?</a>
            </li>
            <li>
              <a href="#peer-score">What is the Peer score?</a>
            </li>
            <li>
              <a href="#cp-positive-peer">
                Why is the Peer Score of the Community Prediction positive?
              </a>
            </li>
            <li>
              <a href="#time-averaging">
                Do all my predictions on a question count toward my score?
              </a>
            </li>
            <li>
              <a href="#extremizing">
                Can I get better scores by predicting extreme values?
              </a>
            </li>
            <li>
              <a href="#score-truncation">
                Why did I get a small score when I was right?
              </a>
            </li>
            <li>
              <a href="#legacy-scores">What are the legacy scores?</a>
              <ul className="space-y-1  pl-4 pt-2">
                <li>
                  <a href="#relative-score">What is the Relative score?</a>
                </li>
                <li>
                  <a href="#coverage">What is the coverage?</a>
                </li>
                <li>
                  <a href="#old-points">What are Metaculus points?</a>
                </li>
              </ul>
            </li>
          </ul>
          <li className="font-bold">
            <a href="#tournaments-section">Tournaments</a>
          </li>
          <ul className="space-y-1 pl-4">
            <li>
              <a href="#tournament-scores">
                How are my tournament Score, Coverage, Take, Prize and Rank
                calculated?
              </a>
            </li>
            <li>
              <a href="#legacy-tournament-scores">
                How are my (legacy) tournament Score, Coverage, Take, Prize and
                Rank calculated?
              </a>
            </li>
            <li>
              <a href="#hidden-period">
                What are the Hidden Period and Hidden Coverage Weights?
              </a>
            </li>
          </ul>
        </ul>
      </div>

      <hr className="my-8" />

      <h1 className="scroll-mt-nav" id="scores-section">
        Scores
      </h1>

      <hr />
      <h2 className="scroll-mt-nav" id="scoring-rule">
        What is a scoring rule?
      </h2>
      <p>
        A scoring rule is a mathematical function which, given a prediction and
        an outcome, gives a score in the form of a number.
      </p>
      <p>
        A naive scoring rule could be: &quot;you score equals the probability
        you gave to the correct outcome&quot;. So, for example, if you predict
        80% and the question resolves Yes, your score would be 0.8 (and 0.2 if
        the question resolved No). At first glance this seems like a good
        scoring rule: forecasters who gave predictions closer to the truth get
        higher scores.
      </p>
      <p>
        Unfortunately this scoring rule is not &quot;proper&quot;, as we&apos;ll
        see in the next section.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="proper-scoring">
        What is a proper scoring rule?
      </h2>
      <p>
        Proper scoring rules have a very special property: the only way to
        optimize your score on average is to predict your sincere beliefs.
      </p>
      <p>
        How do we know that the naive scoring rule from the previous section is
        not proper? An example should be illuminating: consider the question
        &quot;Will I roll a 6 on this fair die?&quot;. Since the die is fair,
        your belief is &quot;1/6&quot; or about 17%. Now consider three
        possibilities: you could either predict your true belief (17%), predict
        something more extreme, like 5%, or predict something less extreme, like
        30%. Here&apos;s a table of the scores you expect for each possible die
        roll:
      </p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-xs font-bold md:text-sm">
              <td className="p-3">outcome die roll</td>
              <td className="p-3">naive score of p=5%</td>
              <td className="p-3">naive score of p=17%</td>
              <td className="p-3">naive score of p=30%</td>
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
              <td className="p-3">average</td>
              <td className="p-3">0.8</td>
              <td className="p-3">0.72</td>
              <td className="p-3">0.63</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Which means you get a better score on average if you predict 5% than
        17%. In other words, this naive score incentivizes you to predict
        something other than the true probability. This is very bad!
      </p>
      <p>
        Proper scoring rules do not have this problem: your score is best when
        you predict the true probability. The log score, which underpins all
        Metaculus scores, is a proper score (see{" "}
        <Link href="/help/scores-faq/#log-score">What is the log score?</Link>).
        We can compare the scores you get in the previous example:
      </p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-xs font-bold  md:text-sm">
              <td className="p-3">outcome die roll</td>
              <td className="p-3">log score of p=5%</td>
              <td className="p-3">log score of p=17%</td>
              <td className="p-3">log score of p=30%</td>
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
              <td className="p-3">average</td>
              <td className="p-3">-0.54</td>
              <td className="p-3">-0.45</td>
              <td className="p-3">-0.51</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        With the log score, you do get a higher (better) score if you predict
        the true probability of 17%.
      </p>
      <hr />
      <h2 className="scroll-mt-nav" id="log-score">
        What is the log score?
      </h2>
      <p>
        The logarithmic scoring rule, or &quot;log score&quot; for short, is
        defined as:
      </p>
      <KatexRenderer
        equation="\text{log score} = \ln(P(outcome))"
        inline={false}
      />
      <p>
        Where <KatexRenderer equation="\ln" inline /> is the natural logarithm
        and <KatexRenderer equation="P(outcome)" inline />
        is the probability predicted for the outcome that actually happened.
        This log score applies to categorical predictions, where one of a
        (usually) small set of outcomes can happen. On Metaculus those are
        Binary and Multiple Choice questions. See the next section for the log
        scores of continuous questions.
      </p>
      <p>Higher scores are better:</p>
      <ul className="ml-6 list-disc">
        <li>
          If you predicted 0% on the correct outcome, your score will be{" "}
          <KatexRenderer equation={`-\\infty`} inline /> (minus infinity).
        </li>
        <li>
          If you predict 100% on the correct outcome, your score will be 0.
        </li>
      </ul>
      <p>
        This means that the log score is always negative (for Binary and
        Multiple Choice questions). This has proved unintuitive, which is one
        reason why Metaculus uses the{" "}
        <Link href="/help/scores-faq/#baseline-score">Baseline</Link> and{" "}
        <Link href="/help/scores-faq/#peer-score">Peer</Link> scores, which are
        based on the log score but can be positive.
      </p>
      <p>
        The log score is proper (see{" "}
        <Link href="/help/scores-faq/#proper-scoring">
          What is a proper scoring rule?
        </Link>
        ). This means that to maximize your score{" "}
        <b>you should predict your true beliefs</b> (see{" "}
        <a href="#extremizing">
          Can I get better scores by predicting extreme values?
        </a>
        ).
      </p>
      <p>
        One interesting property of the log score: it is much more punitive of
        extreme wrong predictions than it is rewarding of extreme right
        predictions. Consider the scores you get for predicting 99% or 99.9%:
      </p>

      <div className="overflow-x-auto">
        <table className="mx-auto w-auto border-collapse">
          <thead>
            <tr className="text-xs font-bold md:text-sm">
              <td className="p-2"></td>
              <td className="p-2">99% Yes, 1% No</td>
              <td className="p-2">99.9% Yes, 0.1% No</td>
            </tr>
          </thead>
          <tbody>
            <tr className="text-xs font-light md:text-sm">
              <td className="p-2">Score if outcome = Yes</td>
              <td className="p-2">-0.01</td>
              <td className="p-2">-0.001</td>
            </tr>
            <tr className="text-xs font-light md:text-sm">
              <td className="p-2">Score if outcome = No</td>
              <td className="p-2">-4.6</td>
              <td className="p-2">-6.9</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Going from 99% to 99.9% only gives you a tiny advantage if you are
        correct (+0.009), but a huge penalty if you are wrong (-2.3). So be
        careful, and only use extreme probabilities when you&apos;re sure
        they&apos;re appropriate!
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="continuous-log-score">
        What is the log score for continuous questions?
      </h2>
      <p>
        Since the domain of possible outcomes for continuous questions is (drum
        roll) continuous, any outcome has mathematically 0 chance of happening.
        Thankfully we can adapt the log score in the form:
      </p>
      <KatexRenderer
        equation="\text{log score} = \ln(\operatorname{pdf}(outcome))"
        inline={false}
      />
      <p>
        Where <KatexRenderer equation="\ln" inline /> is the natural logarithm
        and <KatexRenderer equation="\operatorname{pdf}(outcome)" inline /> is
        the value of the predicted{" "}
        <a href="https://en.wikipedia.org/wiki/Probability_density_function">
          probability density function
        </a>{" "}
        at the outcome. Note that on Metaculus, all pdfs have a{" "}
        <a href="https://en.wikipedia.org/wiki/Uniform_distribution">
          uniform distribution
        </a>{" "}
        of height 0.01 added to them. This prevents extreme log scores.
      </p>
      <p>
        This is also a proper scoring rule, and behaves in somewhat similar ways
        to the log score described above. One difference is that, contrary to
        probabilities that are always between 0 and 1,{" "}
        <KatexRenderer equation="\operatorname{pdf}" inline /> values can be
        greater than 1. This means that the continuous log score can be greater
        than 0: in theory it has no maximum value, but in practice Metaculus
        restricts how sharp pdfs can get (see the maximum scores tabulated
        below).
      </p>
      <p>
        When a continuous question resolves either above the upper bound or
        below the lower bound, it is scored like a binary question. We do not
        define or collect pdf values outside the question range, so the above
        formula does not apply. But we do have the total probability mass out
        the bound, and that can be scored as in the question &quot;Will the
        value be below the lower bound?&quot; or &quot;Will the value be above
        the upper bound?&quot;.
      </p>
      <hr />
      <h2 className="scroll-mt-nav" id="spot-score">
        What is a spot score?
      </h2>
      <p>
        A &quot;spot&quot; score is a specific version of the given score type
        (e.g. &quot;spot peer score&quot;) where the evaluation doesn&apos;t
        take prediction duration into account. For a spot score, only the
        prediction at a specified time is considered. Unless otherwise
        indicated, spot scores are evaluated at the same time the Community
        Prediction is revealed. Coverage is 100% if there is an active
        prediction at the time, and 0% if there is not. The math is the same as
        the given score type.
      </p>
      <hr />
      <h2 className="scroll-mt-nav" id="baseline-score">
        What is the Baseline score?
      </h2>
      <p>
        The Baseline score compares a prediction to a fixed &quot;chance&quot;
        baseline. If it is positive, the prediction was better than chance. If
        it is negative, it was worse than chance.
      </p>
      <p>
        That &quot;chance&quot; baseline gives the same probability to all
        outcomes. For binary questions, this is a prediction of 50%. For an
        N-option multiple choice question it is a prediction of 1/N for every
        option. For continuous questions this is a uniform (flat) distribution.
      </p>
      <p>
        The Baseline score is derived from the{" "}
        <Link href="/help/scores-faq/#log-score">log score</Link>, rescaled so
        that:
      </p>
      <ul className="list-disc pl-5">
        <li>
          Predicting the same probability on all outcomes gives a score of 0.
        </li>
        <li>
          Predicting perfectly on a binary or multiple choice question gives a
          score of +100.
        </li>
        <li>
          The average scores of binary and continuous questions roughly match.
        </li>
      </ul>
      <p>Here are some notable values for the Baseline score:</p>
      <div className="overflow-x-auto">
        <table className="mx-auto w-auto">
          <thead>
            <tr>
              <th className="p-4 text-xs font-bold  md:text-sm"></th>
              <th className="p-4 text-xs font-bold  md:text-sm">
                Binary questions
              </th>
              <th className="p-4 text-xs font-bold  md:text-sm">
                Multiple Choice questions
                <br />
                (8 options)
              </th>
              <th className="p-4 text-xs font-bold  md:text-sm">
                Continuous questions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                Best possible Baseline score on Metaculus
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+99.9</td>
              <td className="p-4 text-xs font-light md:text-sm">+99.9</td>
              <td className="p-4 text-xs font-light md:text-sm">+183</td>
            </tr>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                Worst possible Baseline score on Metaculus
              </td>
              <td className="p-4 text-xs font-light md:text-sm">-897</td>
              <td className="p-4 text-xs font-light md:text-sm">-232</td>
              <td className="p-4 text-xs font-light md:text-sm">-230</td>
            </tr>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                Median Baseline empirical score
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+17</td>
              <td className="p-4 text-xs font-light md:text-sm">no data yet</td>
              <td className="p-4 text-xs font-light md:text-sm">+14</td>
            </tr>
            <tr>
              <td className="p-4 text-xs font-light md:text-sm">
                Average Baseline empirical score
              </td>
              <td className="p-4 text-xs font-light md:text-sm">+13</td>
              <td className="p-4 text-xs font-light md:text-sm">no data yet</td>
              <td className="p-4 text-xs font-light md:text-sm">+13</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Theoretically, binary scores can be infinitely negative, and continuous
        scores can be both infinitely positive and infinitely negative. In
        practice, Metaculus restricts binary predictions to be between 0.1% and
        99.9%, and continuous pdfs to be between 0.01 and ~35, leading to the
        scores above. The empirical scores are based on all scores observed on
        all resolved Metaculus questions, as of November 2023.
      </p>
      <p>
        Note that the above describes the Baseline score at a single point in
        time. Metaculus scores are time-averaged over the lifetime of the
        question, see{" "}
        <Link href="/help/scores-faq/#time-averaging">
          Do all my predictions on a question count toward my score?
        </Link>
        .
      </p>
      <p>You can expand the section below for more details and maths.</p>
      <BaselineMath />
      <hr />
      <h2 className="scroll-mt-nav" id="peer-score">
        What is the Peer score?
      </h2>
      <p>
        The Peer score compares a prediction to all the other predictions made
        on the same question. If it is positive, the prediction was (on average)
        better than others. If it is negative it was worse than others.
      </p>
      <p>
        The Peer score is derived from the{" "}
        <Link href="/help/scores-faq/#log-score">log score</Link>: it is the
        average difference between a prediction&apos;s log score, and the log
        scores of all other predictions on that question. Like the Baseline
        score, the Peer score is multiplied by 100.
      </p>
      <p>
        One interesting property of the Peer score is that, on any given
        question, the sum of all participants&apos; Peer scores is always 0.
        This is because each forecaster&apos;s score is their average difference
        with every other: when you add all the scores, all the differences
        cancel out and the result is 0. Here&apos;s a quick example: imagine a{" "}
        <Link href="/help/scores-faq/#continuous-log-score">
          continuous question
        </Link>
        , with three forecasters having predicted:
      </p>
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Forecaster
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                log score
              </th>
              <th className="px-4 py-2  text-left text-xs font-bold md:text-sm">
                Peer score
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">Alex</td>
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
                Bailey
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
              <td className="px-4 py-2 text-xs font-light md:text-sm">Cory</td>
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
                sum
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                <KatexRenderer equation="-2.5+0.5+2 = 0" inline={false} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>Here are some notable values for the Peer score:</p>
      <table className="mx-auto table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2  text-xs font-bold md:text-sm"></th>
            <th className="px-4 py-2  text-xs font-bold md:text-sm">
              Binary and
              <br />
              Multiple Choice
              <br />
              questions
            </th>
            <th className="px-4 py-2  text-xs font-bold md:text-sm">
              Continuous
              <br />
              questions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-2 text-xs font-light md:text-sm">
              Best possible Peer score on Metaculus
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
              Worst possible Peer score on Metaculus
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
              Median Peer empirical score
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
              Average Peer empirical score
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
      <p>*The average Peer score is 0 by definition.</p>
      <p>
        Theoretically, binary scores can be infinitely negative, and continuous
        scores can be both infinitely positive and infinitely negative. In
        practice, Metaculus restricts binary predictions to be between 0.1% and
        99.9%, and continuous pdfs to be between 0.01 and ~35, leading to the
        scores above.
      </p>
      <p>
        The &quot;empirical scores&quot; are based on all scores observed on all
        resolved Metaculus questions, as of November 2023.
      </p>
      <p>
        Note that the above describes the Peer score at a single point in time.
        Metaculus scores are time-averaged over the lifetime of the question,
        see{" "}
        <Link href="/help/scores-faq/#time-averaging">
          Do all my predictions on a question count toward my score?
        </Link>
        .
      </p>
      <p>You can expand the section below for more details and maths.</p>
      <PeerMath />

      <hr />
      <h2 className="scroll-mt-nav" id="cp-positive-peer">
        Why is the Peer score of the Community Prediction positive?
      </h2>
      <p>
        The <Link href="/help/scores-faq/#peer-score">Peer score</Link> measures
        whether a forecaster was on average better than other forecasters. It is
        the difference between the forecaster&apos;s{" "}
        <Link href="/help/scores-faq/#log-score">log score</Link> and the
        average of all other forecasters&apos; log scores. If you have a
        positive Peer score, it means your log score was better than the average
        of all other forecasters&apos; log scores.
      </p>
      <p>
        The <Link href="/faq/#community-prediction">Community Prediction</Link>{" "}
        is a time-weighted median of all forecasters on the question. Like most
        aggregates, it is better than most of the forecasters it feeds on: it is
        less noisy, less biased, and updates more often.
      </p>
      <p>
        Since the Community Prediction is better than most forecasters, it
        follows that its score should be higher than the average score of all
        forecasters. And so its Peer score is positive.
      </p>
      <FurtherMath />

      <hr />
      <h2 className="scroll-mt-nav" id="time-averaging">
        Do all my predictions on a question count toward my score?
      </h2>
      <p>
        Yes. Metaculus uses time-averaged scores, so all your predictions count,
        proportional to how long they were standing. An example goes a long way
        (we will use the Baseline score for simplicity, but the same logic
        applies to any score):
      </p>
      <p>
        A binary question is open 5 days, then closes and resolves Yes. You
        start predicting on the second day, make these predictions, and get
        those scores:
      </p>
      <div className="w-full overflow-x-auto overflow-y-hidden">
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm"></th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">Day 1</th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">Day 2</th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">Day 3</th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">Day 4</th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">Day 5</th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Average
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                Prediction
              </td>
              <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">40%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">70%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">80%</td>
              <td className="px-4 py-2 text-xs font-light md:text-sm">N/A</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                Baseline score
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
      <p>Some things to note:</p>
      <ul className="ml-5 list-disc">
        <li>
          Before you predict, your score is considered to be 0 (this is true for
          all scores based on the log score). This means that if you believe you
          can do better than 0, you should predict as early as possible.
        </li>
        <li>
          You have a score for Day 4, despite not having predicted that day.
          This is because your predictions stay standing until you update them,
          so on Day 4 you were scored on your Day 3 prediction. On Day 5 you
          updated to 80%, so you were scored on that.
        </li>
        <li>
          This example uses days, but your Metaculus scores are based on exact
          timestamped predictions, so a prediction left standing for 1 hour will
          count for 1/24th of a prediction left standing for a day, etc.
        </li>
      </ul>

      <p>
        Lastly, note that scores are always averaged for every instant between
        the Open date and (scheduled) Close date of the question. If a question
        resolves early (i.e. before the scheduled close date), then scores are
        set to 0 between the resolution date and scheduled close date, and still
        count in the average. This ensures alignment of incentives, as explained
        in the section{" "}
        <Link href="/help/scores-faq/#score-truncation">
          Why did I get a small score when I was right?
        </Link>{" "}
        below.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="extremizing">
        Can I get better scores by predicting extreme values?
      </h2>
      <p>
        Metaculus uses proper scores (see{" "}
        <Link href="/help/scores-faq/#proper-scoring">
          What is a proper scoring rule?
        </Link>
        ), so you cannot get a better score (on average) by making predictions
        more extreme than your beliefs. On any question, if you want to maximize
        your expected score, you should predict exactly what you believe.
      </p>
      <p>
        Let&apos;s walk through a simple example using the Baseline score.
        Suppose you are considering predicting a binary question. After some
        thought, you conclude that the question has 80% chance to resolve Yes.
      </p>
      <p>
        If you predict 80%, you will get a score of +68 if the question resolves
        Yes, and -132 if it resolves No. Since you think there is an 80% chance
        it resolves Yes, you expect on average a score of
      </p>
      <p>
        <KatexRenderer
          equation="80\% \times 68 + 20\% \times -132 = +28"
          inline
        />
      </p>
      <p>
        If you predict 90%, you will get a score of +85 if the question resolves
        Yes, and -232 if it resolves No. Since you think there is an 80% chance
        it resolves Yes, you expect on average a score of
      </p>
      <p>
        <KatexRenderer
          equation="80\% \times 85 + 20\% \times -232 = +21"
          inline
        />
      </p>
      <p>
        So by predicting a more extreme value, you actually lower the score you
        expect to get (on average!).
      </p>
      <p>Here are some more values from the same example, tabulated:</p>
      <div className="w-full overflow-x-auto">
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Prediction
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Score if Yes
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Score if No
              </th>
              <th className="px-4 py-2 text-xs font-bold md:text-sm">
                Expected score
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
      <p>
        The 99% prediction gets the highest score when the question resolves
        Yes, but it also gets the lowest score when it resolves No. This is why,
        on average, the strategy that maximizes your score is to predict what
        you believe. This is one of the reasons why looking at scores on
        individual questions is not very informative; only aggregate over many
        questions are interesting!
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="score-truncation">
        Why did I get a small score when I was right?
      </h2>
      <p>
        To make sure incentives are aligned, Metaculus needs to ensure that our
        scores are proper. We also time-average scores.
      </p>
      <p>
        This has a counter-intuitive consequence: when a question resolves
        before its intended close date, the times between resolution and close
        date need to count in the time-average, with scores of 0. We call this
        &quot;score truncation&quot;.
      </p>
      <p>
        An example is best: imagine the question &quot;Will a new human land on
        the Moon before 2030?&quot;. It can either resolve Yes before 2030
        (because someone landed on the Moon), or it can resolve No in 2030. If
        we did not truncate scores, you could game this question by predicting
        close to 100% in the beginning (since it can only resolve positive
        early), and lower later (since it can only resolve negative at the end).
      </p>
      <p>
        Another way to think about this is that if a question lasts a year, then
        each day (or in fact each second) is scored as a separate question. To
        preserve properness, it is imperative that each day is weighted the same
        in the final average (or at least that the weights be decided in
        advance). From this perspective, not doing truncation is equivalent to
        retroactively giving much more weight to days before the question
        resolves, which is not proper.
      </p>
      <p>
        You can read a worked example with maths by expanding the section below.
      </p>

      <TruncationExample />

      <hr />
      <h2 className="scroll-mt-nav" id="legacy-scores">
        What are the legacy scores?
      </h2>

      <h3 className="scroll-mt-nav" id="relative-score">
        What is the Relative score?
      </h3>
      <p>
        The Relative score compares a prediction to the median of all other
        predictions on the same question. If it is positive, the prediction was
        (on average) better than the median. If it is negative it was worse than
        the median.
      </p>
      <p>It is based on the log score, with the formula:</p>
      <KatexRenderer
        equation="\text{Relative score} = \log_2(p) - \log_2(m)"
        inline={false}
      />
      <p>
        Where <KatexRenderer equation="p" inline /> is the prediction being
        scored and <KatexRenderer equation="m" inline /> is the median of all
        other predictions on that question.
      </p>
      <p>
        As of late 2023, the Relative score is in the process of being replaced
        by the <Link href="/help/scores-faq/#peer-score">Peer score</Link>, but
        it is still used for many open tournaments.
      </p>

      <h3 className="scroll-mt-nav" id="coverage">
        What is the coverage?
      </h3>
      <p>
        The Coverage measures for what proportion of a question&apos;s lifetime
        you had a prediction standing.
      </p>
      <p>
        If you make your first prediction right when the question opens, your
        coverage will be 100%. If you make your first prediction one second
        before the question closes, your coverage will be very close to 0%.
      </p>
      <p>
        The Coverage is used in tournaments, to incentivize early predictions.
      </p>

      <h3 className="scroll-mt-nav" id="old-points">
        What are Metaculus points?
      </h3>
      <p>
        Metaculus points were used as the main score on Metaculus until late
        2023.
      </p>
      <p>
        You can still find the rankings based on points{" "}
        <Link href="/legacy-points-rankings/">here</Link>.
      </p>
      <p>
        They are a proper score, based on the log score. They are a mixture of a
        Baseline-like score and a Peer-like score, so they reward both beating
        an impartial baseline and beating other forecasters.
      </p>
      <p>For full mathematical details, expand the section below.</p>

      <PointsMath />
      <hr className="mt-8" />
      <h1 className="scroll-mt-nav" id="tournaments-section">
        Tournaments
      </h1>

      <hr />
      <h2 className="scroll-mt-nav" id="tournament-scores">
        How are my tournament Score, Take, Prize, and Rank calculated?
      </h2>
      <p>
        This scoring method was introduced in March 2024. It is based on the{" "}
        <Link href="/help/scores-faq/#peer-score">Peer scores</Link> described
        above.
      </p>
      <p>
        Your rank in the tournament is determined by the sum of your Peer scores
        over all questions weighted by the question&apos;s weight in the
        tournament (you get 0 for any question you didn’t forecast). Questions
        that have weights other than 1.0 are indicated in the sidebar of the
        question detail page. Typically, a question weight is changed if it is
        determined to be highly correllated with other questions included in the
        same tournament, especially question groups.
      </p>
      <p>
        The share of the prize pool you get is proportional to that same sum of
        Peer scores, squared. If the sum of your Peer scores is negative, you
        don’t get any prize.
      </p>
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
        For a tournament with a sufficiently large number of independent
        questions, this scoring method is essentially{" "}
        <a href="https://www.metaculus.com/help/scores-faq/#proper-scoring">
          proper
        </a>
        . In short, you should predict your true belief on any question.
      </p>
      <p>
        Taking the square of your Peer scores incentivizes forecasting every
        question and forecasting early. Don’t forget to <b>Follow</b> a
        tournament to be notified of new questions.
      </p>
      <p>
        Note: to limit administrative costs, we also limit prize apportionment
        to amounts above a certain threshold (typically 10$, but it can vary per
        tournament).
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="legacy-tournament-scores">
        How are my (legacy) tournament Score, Coverage, Take, Prize, and Rank
        calculated?
      </h2>
      <p>
        <b>
          This scoring method was superseded in March 2024 by the New Tournament
          Score described above. It is still in use for tournaments that
          concluded before March 2024 for some tournaments that were in flight
          then.
        </b>
      </p>
      <p>
        Your tournament Score is the sum of your Relative scores over all
        questions in the tournament. If, on average, you were better than the
        Community Prediction, then it will be positive; otherwise, it will be
        negative.
      </p>
      <p>
        Your tournament Coverage is the average of your coverage on each
        question. If you predicted all questions when they opened, your Coverage
        will be 100%. If you predicted all questions halfway through, or if you
        predicted half the questions when they opened, your Coverage will be
        50%.
      </p>
      <p>
        Your tournament Take is the exponential of your Score, times your
        Coverage:
      </p>
      <KatexRenderer
        equation="\text{Take} = e^\text{Score} \times \text{Coverage}"
        inline={false}
      />
      <p>
        Your Prize is how much money you earned on that tournament. It is
        proportional to your take and is equal to your Take divided by the sum
        of all competing forecasters&apos; Takes.
      </p>
      <p>
        Your Rank is simply how high you were in the leaderboard, sorted by
        Prize.
      </p>
      <p>
        The higher your Score and Coverage, the higher your Take will be. The
        higher your Take, the more Prize you&apos;ll receive, and the higher
        your Rank will be.
      </p>

      <hr />
      <h2 className="scroll-mt-nav" id="hidden-period">
        What are the Hidden Period and Hidden Coverage Weights?
      </h2>
      <p>
        The Community Prediction is on average much better than most
        forecasters. This means that you could get decent scores by just copying
        the Community Prediction at all times. To prevent this, many tournament
        questions have a significant period of time at the beginning when the
        Community Prediction is hidden. We call this time the Hidden Period.
      </p>
      <p>
        To incentivize forecasting during the hidden period, questions sometimes
        are also set up so that the coverage you accrue during the Hidden Period
        counts more. For example, the Hidden Period could count for 50% of the
        question coverage, or even 100%. We call this percentage the Hidden
        Period Coverage Weight.
      </p>
      <p>
        If the Hidden Period Coverage Weight is 50%, then if you don&apos;t
        forecast during the hidden period your coverage will be at most 50%,
        regardless of how long the hidden period lasted.
      </p>
    </PageWrapper>
  );
}
