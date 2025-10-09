import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { faBrain, faBullseye } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

import AIBInfoIdeaCard from "./aib-info-idea-card";

const AIBInfoIdeaDescription: React.FC = () => {
  return (
    <div className="space-y-16">
      <div className="max-w-[840px] space-y-8 antialiased">
        <h1 className="m-0 text-5xl font-bold leading-[116%] -tracking-[1.92px] text-blue-800 dark:text-blue-800-dark">
          Forecasting is one of the few ways to evaluate{" "}
          <span className="text-blue-600 dark:text-blue-600-dark">
            reasoning against reality.
          </span>
        </h1>

        <div className="space-y-6 text-xl font-medium text-blue-700 dark:text-blue-700-dark">
          <p className="m-0">
            This benchmark measures AI’s ability to forecast the outcome of
            future events, which is essential to many real-world use cases. High
            benchmark scores are indicators that models will be better in
            long-term planning, automated risk assessment, automated decision
            making, and holistic reasoning ability about interdisciplinary
            topics.
          </p>

          <p className="m-0">
            This benchmark is unique in that it cannot be overfit. Additionally,
            base models compete against both human forecasters and the best
            community prompting approaches. FutureEval uses 2 initiatives to
            measure this.
          </p>
        </div>
      </div>

      <div className="flex gap-14">
        {IDEA_CARDS.map((card) => (
          <AIBInfoIdeaCard key={card.title} icon={card.icon} title={card.title}>
            {card.content}
          </AIBInfoIdeaCard>
        ))}
      </div>
    </div>
  );
};

const IDEA_CARDS = [
  {
    icon: faCircleDot,
    title: "LLMs vs Metaculus",
    content: (
      <>
        <p>
          FutureEval’s first initiative is to run a Metaculus account for each
          LLM model from each major AI provider on the site. These accounts
          forecast regularly on most questions on the site and allow for the
          creation of a continuously updated leaderboard that ranks each model
          against each other over time.
        </p>
        <p>
          See more <Link href="/notebooks/38928/aib-resource-page/">here.</Link>
        </p>
      </>
    ),
  },
  {
    icon: faBullseye,
    title: "LLMs vs Bots vs Humans",
    content: (
      <>
        <p>
          FutureEval’s second initiative is running seasonal tournaments with
          $175k in prizes given to the best AI bot-makers around the world. Bots
          win prize money based on how well their forecasts do. Metaculus also
          collects forecasts from humans (e.g. pro forecasters) and from each
          LLM we benchmark in order to tell how well humans do comparatively and
          how custom bot scaffolding affects accuracy.
        </p>
        <p>
          See more <Link href="/notebooks/38928/aib-resource-page/">here.</Link>
        </p>
      </>
    ),
  },
  {
    icon: faBrain,
    title: "No Overfitting",
    content: (
      <p>
        Forecasting benchmarks are unique in that it is impossible to
        pre-emptively train a model on the answers, because by nature, we don’t
        know them yet. FutureEval, then, is one of the most robust benchmarks in
        measuring holistic reasoning ability.
      </p>
    ),
  },
];

export default AIBInfoIdeaDescription;
