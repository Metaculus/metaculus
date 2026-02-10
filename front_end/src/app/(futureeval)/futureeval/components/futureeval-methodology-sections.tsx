"use client";

import { faChevronDown, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import Link from "next/link";
import React, { PropsWithChildren, ReactNode } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";
import { useFutureEvalLeaderboard } from "./leaderboard/futureeval-leaderboard-provider";

const PROMPTS = {
  binary: `You are a professional forecaster interviewing for a job.

Your interview question is:
{question.question_text}

Question background:
{question.background_info}

This question's outcome will be determined by the specific criteria below. These criteria have not yet been satisfied:
{question.resolution_criteria}

{question.fine_print}

Your research assistant says:
{research}

Today is {datetime.now().strftime("%Y-%m-%d")}.

Before answering you write:

(a) The time left until the outcome to the question is known.

(b) The status quo outcome if nothing changed.

(c) A brief description of a scenario that results in a No outcome.

(d) A brief description of a scenario that results in a Yes outcome.

You write your rationale remembering that good forecasters put extra weight on the status quo outcome since the world changes slowly most of the time.

{self._get_conditional_disclaimer_if_necessary(question)}

The last thing you write is your final answer as: "Probability: ZZ%", 0-100`,

  numeric: `You are a professional forecaster interviewing for a job.

Your interview question is:
{question.question_text}

Background:
{question.background_info}

{question.resolution_criteria}

{question.fine_print}

Units for answer: {question.unit_of_measure if question.unit_of_measure else "Not stated (please infer this)"}

Your research assistant says:
{research}

Today is {datetime.now().strftime("%Y-%m-%d")}.

{lower_bound_message}
{upper_bound_message}

Formatting Instructions:
- Please notice the units requested and give your answer in these units (e.g. whether you represent a number as 1,000,000 or 1 million).
- Never use scientific notation.
- Always start with a smaller number (more negative if negative) and then increase from there. The value for percentile 10 should always be less than the value for percentile 20, and so on.

Before answering you write:
(a) The time left until the outcome to the question is known.
(b) The outcome if nothing changed.
(c) The outcome if the current trend continued.
(d) The expectations of experts and markets.
(e) A brief description of an unexpected scenario that results in a low outcome.
(f) A brief description of an unexpected scenario that results in a high outcome.

{self._get_conditional_disclaimer_if_necessary(question)}
You remind yourself that good forecasters are humble and set wide 90/10 confidence intervals to account for unknown unknowns.

The last thing you write is your final answer as:
"
Percentile 10: XX (lowest number value)
Percentile 20: XX
Percentile 40: XX
Percentile 60: XX
Percentile 80: XX
Percentile 90: XX (highest number value)
"`,

  multipleChoice: `You are a professional forecaster interviewing for a job.

Your interview question is:
{question.question_text}

The options are: {question.options}

Background:
{question.background_info}

{question.resolution_criteria}

{question.fine_print}

Your research assistant says:
{research}

Today is {datetime.now().strftime("%Y-%m-%d")}.

Before answering you write:

(a) The time left until the outcome to the question is known.

(b) The status quo outcome if nothing changed.

(c) A description of a scenario that results in an unexpected outcome.

{self._get_conditional_disclaimer_if_necessary(question)}

You write your rationale remembering that (1) good forecasters put extra weight on the status quo outcome since the world changes slowly most of the time, and (2) good forecasters leave some moderate probability on most options to account for unexpected outcomes.

The last thing you write is your final probabilities for the N options in this order {question.options} as:

Option_A: Probability_A

Option_B: Probability_B

...

Option_N: Probability_N`,
};

/**
 * FutureEval-themed disclosure/accordion component
 */
const FutureEvalDisclosure: React.FC<PropsWithChildren<{ title: string }>> = ({
  title,
  children,
}) => {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="w-full">
          <DisclosureButton
            className={cn(
              "group flex w-full items-center gap-3 rounded-md px-4 py-3 text-left transition-all",
              FE_TYPOGRAPHY.body,
              open
                ? "rounded-b-none bg-futureeval-primary-light/20 dark:bg-futureeval-primary-dark/20"
                : "bg-futureeval-bg-dark/5 hover:bg-futureeval-bg-dark/10 dark:bg-futureeval-bg-light/5 dark:hover:bg-futureeval-bg-light/10"
            )}
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={cn(
                "text-sm transition-transform",
                FE_COLORS.textAccent,
                open && "rotate-180"
              )}
            />
            <span className={FE_COLORS.textHeading}>{title}</span>
          </DisclosureButton>
          <Transition
            show={open}
            enter="transition-all duration-300 ease-in-out"
            enterFrom="max-h-0 opacity-0 overflow-hidden"
            enterTo="max-h-[4000px] opacity-100 overflow-hidden"
            leave="transition-all duration-300 ease-in-out"
            leaveFrom="max-h-[4000px] opacity-100 overflow-hidden"
            leaveTo="max-h-0 opacity-0 overflow-hidden"
          >
            <DisclosurePanel
              static
              className={cn(
                "rounded-b-md border-x border-b px-4 py-4",
                "border-futureeval-primary-light/20 dark:border-futureeval-primary-dark/20"
              )}
            >
              {children}
            </DisclosurePanel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};

/**
 * Code block component for displaying prompts
 */
const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-md p-4 text-xs leading-relaxed sm:text-sm",
        "bg-futureeval-bg-dark/5 dark:bg-futureeval-bg-light/5",
        FE_COLORS.textSubheading
      )}
    >
      <code className="whitespace-pre-wrap break-words font-mono">{code}</code>
    </pre>
  );
};

/**
 * Section header component matching the main methodology heading style
 * Optionally accepts an id to enable copy-link functionality
 */
const SectionHeader: React.FC<{ children: ReactNode; id?: string }> = ({
  children,
  id,
}) => {
  const handleCopyLink = () => {
    if (id && typeof window !== "undefined" && navigator.clipboard) {
      const url = `${globalThis.location.origin}${globalThis.location.pathname}#${id}`;
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast("Link copied to clipboard", {
            className: "dark:bg-blue-700-dark dark:text-gray-0-dark",
          });
        })
        .catch((err) => console.error("Error copying link: ", err));
    }
  };

  return (
    <h2
      id={id}
      className={cn(
        "group m-0 max-w-3xl",
        id && "scroll-mt-24",
        FE_TYPOGRAPHY.h1,
        FE_COLORS.textHeading
      )}
    >
      {children}
      {id && (
        <button
          type="button"
          onClick={handleCopyLink}
          className={cn(
            "ml-2 inline-flex cursor-pointer items-center border-none bg-transparent p-1 align-middle opacity-0 transition-opacity",
            "hover:!opacity-100 group-hover:opacity-50",
            FE_COLORS.textAccent
          )}
          title="Copy link to section"
          aria-label="Copy link to section"
        >
          <FontAwesomeIcon icon={faLink} className="text-sm" />
        </button>
      )}
    </h2>
  );
};

/**
 * Section body text component
 */
const SectionBody: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <div
      className={cn(
        "space-y-4 antialiased",
        FE_TYPOGRAPHY.body,
        FE_COLORS.textSubheading
      )}
    >
      {children}
    </div>
  );
};

/**
 * Bulleted list with FutureEval theming
 */
const BulletList: React.FC<{ items: ReactNode[] }> = ({ items }) => {
  return (
    <ul className="m-0 space-y-3 pl-5">
      {items.map((item, index) => (
        <li key={index} className="list-disc text-xs md:text-sm">
          {item}
        </li>
      ))}
    </ul>
  );
};

/**
 * All additional methodology sections
 */
const FutureEvalMethodologySections: React.FC = () => {
  const { sotaCrossingDates } = useFutureEvalLeaderboard();
  const { communityDate, proDate } = sotaCrossingDates;

  return (
    <div className="space-y-[60px] sm:space-y-[80px] lg:space-y-[120px]">
      {/* Section 1: What Makes FutureEval Unique */}
      <section className="space-y-6">
        <SectionHeader id="what-makes-futureeval-unique">
          What Makes{" "}
          <span className={FE_COLORS.textAccent}>FutureEval Unique</span>
        </SectionHeader>
        <SectionBody>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left column: Compared to reasoning benchmarks */}
            <div className="space-y-4">
              <p className="m-0 text-base font-semibold md:text-lg">
                Compared to reasoning benchmarks:
              </p>
              <BulletList
                items={[
                  <span key="decision">
                    <strong>Decision-making applications:</strong> FutureEval
                    measures how good AIs are at forecasting future events.
                    FutureEval tells us how much we can trust AIs when they say
                    that an event is likely, or that a risk is improbable enough
                    to ignore safely. Forecasting is involved with long-term
                    planning, decision-making, failure mode analysis, causal
                    analysis, understanding human motivations, and more.
                  </span>,
                  <span key="contamination">
                    <strong>No Contamination:</strong> The ground-truth answers
                    to our questions are not known when the AIs make forecasts,
                    so it&apos;s impossible to train on the test set.
                  </span>,
                  <span key="saturation">
                    <strong>No Saturation:</strong> Some AI reasoning benchmarks
                    have already become saturated as AI reaches 100% accuracy on
                    them. But tomorrow is unpredictable, and next year even more
                    so. We can make forecasting questions almost arbitrarily
                    more challenging by making them more niche and precise, and
                    longer term. FutureEval can scale in difficulty as AI
                    capabilities increase.
                  </span>,
                  <span key="interdisciplinary">
                    <strong>Interdisciplinary Reasoning:</strong> Our diverse
                    question topics range from economics, politics, tech, war,
                    elections, society, climate, science, and more. Many
                    questions require knowledge and reasoning from multiple
                    fields. Forecasting forces models to generalize beyond
                    memorization for actively evolving domains relevant to the
                    real world.
                  </span>,
                ]}
              />
            </div>

            {/* Right column: Compared to other forecasting benchmarks */}
            <div className="space-y-4">
              <p className="m-0 text-base font-semibold md:text-lg">
                Compared to other forecasting benchmarks:
              </p>
              <BulletList
                items={[
                  <span key="community">
                    <strong>Largest community of custom bots:</strong>{" "}
                    FutureEval has attracted the largest community of bot
                    makers, who have spent significant time customising their
                    bots. This lets us probe the frontier of AI forecasting. Our
                    tournament competitors include startups, non-profits,
                    independent researchers, and students.
                  </span>,
                  <span key="numeric">
                    <strong>Numeric and Multiple Choice Questions:</strong> Many
                    benchmarks only ask binary (Yes/No) questions. FutureEval
                    also asks numeric questions (bots submit a probability
                    distribution) and multiple choice questions (bots submit a
                    list of probabilities). To our knowledge, no other benchmark
                    evaluates high-precision probability distributions for
                    numeric predictions.
                  </span>,
                  <span key="competition">
                    <strong>Competition:</strong> Metaculus incentivises
                    building the best forecasting bots with $50,000 in prizes
                    per season.
                  </span>,
                  <span key="quality">
                    <strong>High quality diverse questions:</strong> Our own
                    writers have years of experience developing
                    decision-relevant and high quality questions for the
                    Metaculus platform and our clients, and use it to write and
                    curate the FutureEval questions. They largely avoid
                    entertainment questions that make the bulk of content on
                    prediction markets, to focus on global events of importance.
                  </span>,
                  <span key="probabilistic">
                    <strong>Probabilistic forecasts:</strong> FutureEval
                    collects quantitative forecasts (not just a &quot;yes&quot;
                    or &quot;no&quot; answer) and scores them using{" "}
                    <Link
                      href="https://www.metaculus.com/help/scores-faq/#proper-scoring"
                      className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
                    >
                      proper scoring rules
                    </Link>
                    , allowing us to measure accuracy, calibration and
                    discrimination.
                  </span>,
                ]}
              />
            </div>
          </div>
        </SectionBody>
      </section>

      {/* Section 2: The Model Leaderboard */}
      <section className="space-y-6">
        <SectionHeader id="model-leaderboard">
          The <span className={FE_COLORS.textAccent}>Model Leaderboard</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            We run all major models with a simple, fixed prompt on most
            Metaculus forecasting questions. Those are implemented as
            &quot;MetacBots&quot; with username{" "}
            <code className="rounded bg-futureeval-bg-dark/10 px-1 py-0.5 dark:bg-futureeval-bg-light/10">
              metac-[model-name]+asknews
            </code>
            . You can spot these in various tournaments on the Metaculus
            platform.{" "}
            <Link
              href="#how-bots-run"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              See how bots run
            </Link>
            .
          </p>
          <p className="m-0">
            As questions resolve, we score the models&apos; forecasts and
            continuously update our{" "}
            <Link
              href="/futureeval#model-leaderboard"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              leaderboard
            </Link>
            . In our rankings, we only evaluate forecasts made within 1 year of
            the model&apos;s first forecast, since model performance tends to
            worsen as their training data becomes more out of date (see e.g.{" "}
            <Link
              href="https://arxiv.org/abs/2411.08324v2"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              here
            </Link>
            ).
          </p>
          <p className="m-0">
            We use head-to-head{" "}
            <Link
              href="https://www.metaculus.com/help/scores-faq/#peer-score"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              Peer Scores
            </Link>{" "}
            (essentially differences in{" "}
            <Link
              href="https://www.metaculus.com/help/scores-faq/#log-score"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              log scores
            </Link>
            ) to determine a forecasting skill score that fairly compares models
            across diverse questions. The skill score is roughly comparable to
            the Peer Scores we use in regular tournaments, and is arbitrarily
            set to 0 for GPT-4o (which is our most prolific bot as of February
            2025).{" "}
            <Link
              href="https://www.metaculus.com/notebooks/42076/the-futureeval-model-leaderboard/"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              Read more about skill scores
            </Link>
            .
          </p>

          {/* CTA to leaderboard */}
          <div className="mt-2">
            <Button
              href="/futureeval/leaderboard"
              className={cn(
                "border",
                FE_COLORS.borderPrimary,
                FE_COLORS.textAccent,
                "hover:opacity-80"
              )}
            >
              View the Full Leaderboard
            </Button>
          </div>
        </SectionBody>
      </section>

      {/* Section 3: Forecasting Performance Over Time */}
      <section className="space-y-6">
        <SectionHeader id="forecasting-performance-over-time">
          Performance <span className={FE_COLORS.textAccent}>Over Time</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            The{" "}
            <Link
              href="/futureeval#performance-over-time-graph"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              Forecasting Performance Over Time
            </Link>{" "}
            graph is another way to visualize the data from the{" "}
            <Link
              href="#model-leaderboard"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              Model Leaderboard
            </Link>
            . In this graph we plot the models&apos; forecasting score vs. their
            release date. We fit a trend to the Frontier Models (the models that
            push the frontier of forecasting performance), which lets us
            estimate when the best models will reach top human performance. The
            pro and community performance baselines are calculated using all
            questions where both humans and bots made forecasts — from the first
            forecast of our first AI model to today. These lines may move as new
            data is added to this running average.
          </p>
          {communityDate && proDate && (
            <p className="m-0">
              The trend line indicates that bots will start beating the
              Metaculus community performance in{" "}
              <strong>{communityDate}</strong> and Pro Forecaster performance in{" "}
              <strong>{proDate}</strong>.
            </p>
          )}
        </SectionBody>
      </section>

      {/* Section 4: How do you run your bots? */}
      <section className="space-y-6">
        <SectionHeader id="how-bots-run">
          How FutureEval <span className={FE_COLORS.textAccent}>Bots Work</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            We run a number of simple bots (nicknamed &quot;MetacBots&quot;) on
            Metaculus to evaluate model performance for the Model Leaderboard
            and in the Bot Tournaments. They&apos;re all named{" "}
            <code className="rounded bg-futureeval-bg-dark/10 px-1 py-0.5 dark:bg-futureeval-bg-light/10">
              metac-[model-name]+[search-provider]
            </code>
            , and are not eligible for prizes in tournaments. They use a
            standardized prompt and usually use AskNews as a search provider.
            For example,{" "}
            <code className="rounded bg-futureeval-bg-dark/10 px-1 py-0.5 dark:bg-futureeval-bg-light/10">
              metac-gpt-4o+asknews
            </code>{" "}
            uses our standardized prompt, AskNews for research and GPT-4o for
            making the predictions.
          </p>
          <p className="m-0">
            You can find the code for our MetacBots{" "}
            <Link
              href="https://github.com/Metaculus/forecasting-tools/blob/main/run_bots.py"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              here
            </Link>
            , and the different prompts{" "}
            <Link
              href="https://github.com/Metaculus/forecasting-tools/tree/main/forecasting_tools/forecast_bots/official_bots"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              here
            </Link>{" "}
            (reproduced below).
          </p>

          {/* Prompt Accordions */}
          <div className="mt-6 space-y-3">
            <FutureEvalDisclosure title="Prompt for Binary Forecasting">
              <CodeBlock code={PROMPTS.binary} />
            </FutureEvalDisclosure>

            <FutureEvalDisclosure title="Prompt for Numeric Forecasting">
              <CodeBlock code={PROMPTS.numeric} />
            </FutureEvalDisclosure>

            <FutureEvalDisclosure title="Prompt for Multiple Choice Forecasting">
              <CodeBlock code={PROMPTS.multipleChoice} />
            </FutureEvalDisclosure>
          </div>
        </SectionBody>
      </section>

      {/* Section 5: The Human Baselines */}
      <section className="space-y-6">
        <SectionHeader id="human-baselines">
          The <span className={FE_COLORS.textAccent}>Human Baselines</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            Some of the questions in the Bot Tournaments come from the Metaculus
            platform, where our forecasting community competes to make the best
            predictions. To establish an even higher bar, we also engage our
            hand-picked{" "}
            <Link
              href="https://www.metaculus.com/services/pro-forecasters/"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              Pro Forecasters
            </Link>{" "}
            to provide high-quality predictions and reasoning on a subset of
            questions in our Bot Tournament (around 100 per tournament). This
            gives two high-quality baselines to evaluate the progress of AI
            forecasting bots. We use these in our analysis comparing whether{" "}
            <Link
              href="#pros-beat-bots"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              pros beat bots
            </Link>
            .
          </p>
        </SectionBody>
      </section>

      {/* Section 6: How much Pros beat Bots */}
      <section className="space-y-6">
        <SectionHeader id="pros-beat-bots">
          Pros vs. <span className={FE_COLORS.textAccent}>Bots</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            At the end of each season, we publish an analysis investigating
            whether the best bots in our Bot Tournament are better or worse than
            the best humans and by how much.
          </p>
          <p className="m-0">
            The{" "}
            <Link
              href="/futureeval#pros-vs-bots-graph"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              graph on our benchmark page
            </Link>{" "}
            shows how much better pros did than bots when comparing a team of 10
            pros and the best 10 bots in the first four Bot Tournaments. Note
            that Q3 and Q4 2024 included only binary questions, while Q1 and Q2
            2025 also included numeric and multiple choice questions. The Pro
            lead tends to be larger on non-binary question types, which may
            partly explain the increase in later quarters.
          </p>
          <p className="m-0">
            You can find the full details and methodology of these analyses in
            the{" "}
            <Link
              href="https://www.metaculus.com/notebooks/38928/ai-benchmark-resources/#futureeval-results-year-1"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              &quot;FutureEval Results Year 1&quot;
            </Link>{" "}
            section of our resources page. Note that the graph&apos;s y-axis is
            labelled &quot;Pro Lead Over Bots.&quot; Technically, this should be
            labelled as &quot;average head-to-head spot peer score for
            Pros&quot;, but &quot;Pro Lead Over Bots&quot; communicates a
            similar idea for readers unfamiliar with forecasting scoring rules.
            A score of 0 would mean that Pros and Bots performed equally well.
          </p>
        </SectionBody>
      </section>
    </div>
  );
};

export default FutureEvalMethodologySections;
