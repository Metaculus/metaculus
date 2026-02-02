"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import Link from "next/link";
import React, { PropsWithChildren, ReactNode } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { FE_COLORS, FE_TYPOGRAPHY } from "../theme";

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
 */
const SectionHeader: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <h2
      className={cn("m-0 max-w-3xl", FE_TYPOGRAPHY.h1, FE_COLORS.textHeading)}
    >
      {children}
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
  return (
    <div className="space-y-[60px] sm:space-y-[80px] lg:space-y-[120px]">
      {/* Section 1: What is Unique About FutureEval? */}
      <section className="space-y-6">
        <SectionHeader>
          What is Unique About{" "}
          <span className={FE_COLORS.textAccent}>FutureEval?</span>
        </SectionHeader>
        <SectionBody>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left column: Compared to reasoning benchmarks */}
            <div className="space-y-4">
              <p className="m-0 text-sm font-semibold md:text-base">
                Compared to reasoning benchmarks:
              </p>
              <BulletList
                items={[
                  <span key="diverse">
                    <strong>Diverse interdisciplinary topics:</strong> Our
                    diverse question topics range from economics, politics,
                    tech, sports, war, elections, society, and more. Many
                    questions require knowledge and reasoning from multiple
                    fields. Questions force models to generalize beyond
                    memorization for actively evolving domains relevant to the
                    real world.
                  </span>,
                  <span key="contamination">
                    <strong>No contamination:</strong> Pre-training on our
                    question sets is impossible, since by nature the answers to
                    questions about the future are not known in advance.
                  </span>,
                  <span key="saturation">
                    <strong>No Saturation:</strong> Some AI reasoning benchmarks
                    have already become saturated as AI reaches 100% accuracy on
                    them. However, the future is inherently unpredictable, which
                    gets worse as questions ask about events further and further
                    into the future. Thus, benchmark saturation will never be
                    reached.
                  </span>,
                  <span key="decision">
                    <strong>Decision-making applications:</strong> FutureEval
                    helps determine how much we can trust AI in big, uncertain
                    decisions by assessing how good it is at predicting future
                    events. Skill in FutureEval correlates with skill in
                    long-term planning, decision-making, failure mode analysis,
                    causal analysis, understanding of human motivation, etc.
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
                    <strong>Largest community of custom bots:</strong> Almost
                    every forecasting benchmark runs the same bot on many
                    different models. FutureEval has collected the largest
                    community of bot makers who have spent significant time
                    making custom bots. This gives useful data on how far we can
                    push bots beyond simple base templates. Our community
                    includes startups, non-profits, hobbyists, and students.
                  </span>,
                  <span key="numeric">
                    <strong>Numeric and Multiple Choice Questions:</strong> Most
                    benchmarks only run binary questions. FutureEval also runs
                    questions that ask bots to submit probability distributions
                    (for numeric questions) along with probabilities of multiple
                    options (for multiple choice questions).
                  </span>,
                  <span key="prizes">
                    <strong>Prize Money:</strong> Metaculus rewards good
                    forecasting with monetary prizes.
                  </span>,
                  <span key="quality">
                    <strong>High quality diverse questions:</strong> Questions
                    on Metaculus are some of the highest quality of any
                    forecasting platform. Every question is created by
                    experienced question creators who have experience
                    identifying common flaws in questions (preventing ambiguous
                    resolutions, making questions impactful, etc.). Questions
                    are pulled from important news issues and the needs of the
                    community, and don&apos;t include as many lower-importance
                    questions that other platforms like to focus on (like
                    sports). Questions are also diverse, as stated above (Note:
                    Due to automation, questions in the MiniBench series
                    don&apos;t have the same level of quality as the main
                    tournament).
                  </span>,
                  <span key="probabilistic">
                    <strong>Probabilistic forecasts:</strong> A few forecasting
                    benchmarks collect &quot;yes&quot; or &quot;no&quot;
                    responses from bots or only measure accuracy. Metaculus
                    collects probabilistic forecasts and scores them using{" "}
                    <Link
                      href="https://www.metaculus.com/help/scores-faq/#proper-scoring"
                      className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
                    >
                      proper scoring rules
                    </Link>
                    .
                  </span>,
                ]}
              />
            </div>
          </div>
        </SectionBody>
      </section>

      {/* Section 2: What is the Model Leaderboard? */}
      <section id="model-leaderboard" className="scroll-mt-24 space-y-6">
        <SectionHeader>
          What is the{" "}
          <span className={FE_COLORS.textAccent}>Model Leaderboard?</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0 font-semibold">Model Ranking Table:</p>
          <p className="m-0">
            Metaculus has put together a leaderboard ranking AI models based on
            forecasting ability. We run all major AI models with a simple prompt
            on most open Metaculus forecasting questions, and collect their
            forecasts. As questions resolve, we score the models&apos; forecasts
            and continuously update our leaderboard to rank them against each
            other.
          </p>
          <p className="m-0">
            Scores use a variation of{" "}
            <Link
              href="https://www.metaculus.com/help/scores-faq/#peer-score"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              peer scoring
            </Link>{" "}
            that uses ridge regressions to compare models across time in a fair
            manner. The resulting score can be interpreted like a peer score.
          </p>
          <p className="m-0">
            Each entry corresponds to one of the &quot;Metac Bots&quot; we are
            running on the site that uses the specified model. You can find
            information about how these are configured in the{" "}
            <Link
              href="https://www.metaculus.com/notebooks/38928/aib-resource-page/#what-are-the-metac-bots"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              Metac Bot
            </Link>{" "}
            section on the resources page.
          </p>

          {/* CTA to leaderboard - placed after Model Ranking Table section */}
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

          <p className="m-0 mt-4 font-semibold">Performance Over Time Graph:</p>
          <p className="m-0">
            We also plot trends in model release date and scores over time. This
            provides an indication of how model performance has improved over
            time, and can be used to extrapolate when bots will reach pro level.
          </p>
        </SectionBody>
      </section>

      {/* Section 3: What is the Pro vs Bots Graph? */}
      <section className="space-y-6">
        <SectionHeader>
          What is the{" "}
          <span className={FE_COLORS.textAccent}>Pro vs Bots Graph?</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            On the FutureEval{" "}
            <Link
              href="/futureeval"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              benchmark page
            </Link>
            , you can find a graph comparing bots and pros over the 4 quarters
            of our first year of AI Benchmarking. These data points are pulled
            directly from the results of each of the quarterly tournaments we
            ran in Year 1 of the Bot Tournament. Each corresponding data
            analysis write-up reports a head-to-head spot peer score comparing a
            bot team and a human pro team.
          </p>
          <p className="m-0">
            You can find the full details of these reports in our{" "}
            <Link
              href="https://www.metaculus.com/notebooks/38928/ai-benchmark-resources/#futureeval-results-year-1"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              &quot;FutureEval Results Year 1&quot;
            </Link>{" "}
            section on our resources page. Note that the graph&apos;s y-axis is
            labelled &quot;Average score difference,&quot; which is not
            technically correct, but communicates the same idea as what is
            actually used (a head-to-head peer score) for readers unfamiliar
            with forecasting scoring rules.
          </p>
        </SectionBody>
      </section>

      {/* Section 4: How do you run your bots? */}
      <section className="space-y-6">
        <SectionHeader>
          How do you run{" "}
          <span className={FE_COLORS.textAccent}>your bots?</span>
        </SectionHeader>
        <SectionBody>
          <p className="m-0">
            Metaculus runs a number of bots (called our &quot;Metac Bots&quot;)
            on Metaculus in order to get values for the Model Leaderboard. We
            also run bots as a comparison point in the Bot Tournament and
            MiniBench. In the tournament leaderboards, these bots will be
            excluded from final prize calculations, and are prepended with
            &apos;metac&apos;.
          </p>
          <p className="m-0">
            Unless indicated otherwise, bots use a standardized prompt (a
            different one per question type) and use AskNews as a search
            provider. For example, &apos;metac-gpt-4o+asknews&apos; runs our
            standardized prompt, uses AskNews for research and GPT-4o for
            prediction. Additionally, &apos;metac-deepseek-r1+sonar-pro&apos;
            uses a standard prompt, uses Perplexity&apos;s Sonar Pro model for
            research, and DeepSeekR1 as the prediction model.
          </p>
          <p className="m-0">
            You can find the script that runs our Metac Bots{" "}
            <Link
              href="https://github.com/Metaculus/forecasting-tools/blob/main/run_bots.py"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              here
            </Link>
            , and the different prompts of our bots{" "}
            <Link
              href="https://github.com/Metaculus/forecasting-tools/tree/main/forecasting_tools/forecast_bots/official_bots"
              className={cn(FE_TYPOGRAPHY.link, FE_COLORS.textAccent)}
            >
              here
            </Link>
            .
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
    </div>
  );
};

export default FutureEvalMethodologySections;
