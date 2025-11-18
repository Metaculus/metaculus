import Image from "next/image";

import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "How to forecast on Metaculus",
  description:
    "Learn how to forecast effectively on Metaculus with our comprehensive guide. Discover best practices, understand scoring systems, and enhance your prediction skills across a wide range of topics including science, technology, and global events.",
};

export default function QuestionChecklist() {
  return (
    <PageWrapper>
      <h1>How to forecast on Metaculus</h1>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">
          Binary and Multiple Choice Questions
        </h2>
        <p>
          <b>Examples:</b>{" "}
          <i>&quot;Who will be Japan&apos;s next Prime Minister?&quot;</i>,{" "}
          <i>&quot;Will NASA&apos;s Artemis 2 launch be successful?&quot;</i>, …
        </p>
        <p>
          To predict, share the probability you give the outcome as a number
          between 0.1% and 99.9%. On the question page, simply drag the
          prediction slider until it matches your probability and click
          “Predict”. You can also use the arrows to refine your probability or
          select the field and type the probability.
        </p>
        <Image
          src="https://cdn.metaculus.com/binary.gif"
          alt="Binary prediction example"
          className="my-4 h-auto max-w-full"
          width={1308}
          height={480}
          unoptimized
          priority
        />
        <p>
          <b>Multiple choice</b> questions ask about more than two (Yes/No)
          possibilities. Predicting works the same, except your predictions
          should sum to 100%. After inputting probabilities, select auto-sum to
          guarantee they do.
        </p>
        <Image
          src="https://cdn.metaculus.com/multiple-choice.gif"
          alt="Multiple choice prediction example"
          className="my-4 h-auto max-w-full"
          width={1152}
          height={720}
          unoptimized
          priority
        />
        <p>
          The higher the probability you place on the correct outcome, the
          better (more positive) your score will be. Give the correct outcome a
          low probability and you&apos;ll receive a bad (negative) score. Under
          Metaculus scoring, you&apos;ll get the best score by predicting what
          you think the actual probability is, rather than trying to “game” the
          scoring.
        </p>

        <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />

        <h2 className="text-2xl font-bold">Numerical and Date Questions</h2>
        <p>
          <b>Examples:</b> <i>&quot;When will humans land on Mars?&quot;</i>,{" "}
          <i>&quot;What will Germany&apos;s GDP growth be in 2025?&quot;</i>, …
        </p>
        <p>
          To predict, provide a distribution, representing how likely you think
          each outcome in a range is. On the question page, drag the slider to
          change the shape of your bell curve, and focus your prediction on
          values you think are likely.
        </p>
        <Image
          src="https://cdn.metaculus.com/numerical.gif"
          alt="Numerical prediction example"
          className="my-4 h-auto max-w-full"
          width={1148}
          height={720}
          unoptimized
          priority
        />
        <p>
          If you want to distribute your prediction in more than one section of
          the range, you can add up to four independent bell curves to build
          your distribution and assign a weight to each of them.
        </p>
        <Image
          src="https://cdn.metaculus.com/numerical2.gif"
          alt="Multiple bell curve prediction example"
          className="my-4 h-auto max-w-full"
          width={972}
          height={716}
          unoptimized
          priority
        />
        <p>
          The higher your distribution is on the value that ultimately occurs,
          the better your score. The lower your distribution on the actual
          value, the worse your score. To get the best score, make your
          distribution reflect how likely each possible value actually is.
        </p>
      </div>
    </PageWrapper>
  );
}
