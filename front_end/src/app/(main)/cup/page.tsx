import Link from "next/link";

import { CupVideo } from "./components/CupVideo";

export const metadata = {
  title: "Metaculus Cup",
  description:
    "Join the Metaculus Cup and compete for a share of the $5,000 prize pool by predicting topical questions from May 5th to September 1st.",
  openGraph: {
    title: "Metaculus Cup",
    description:
      "Join the Metaculus Cup and compete for a share of the $5,000 prize pool by predicting topical questions from May 5th to September 1st.",
    images: [
      {
        url: "https://cdn.metaculus.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Metaculus Cup - Forecasting Tournament",
      },
    ],
  },
};

export default function MetaculusCupPage() {
  return (
    <main
      className="min-h-screen scroll-smooth pb-4 pt-6 md:pb-16 md:pt-12"
      style={{
        background: "linear-gradient(180deg, #0F1727 0%, #36538D 100%)",
      }}
    >
      <div className="relative mx-auto w-full min-[976px]:rounded-md ">
        <div
          className="mx-auto w-full"
          style={{ maxWidth: "clamp(160px, 50vw, 448px)" }}
        >
          <CupVideo />
        </div>
        <div className="absolute left-1/2 top-1/2 mt-[10px] w-full -translate-x-1/2 -translate-y-1/2 text-center text-[clamp(32px,10vw,90px)] font-semibold text-white">
          Metaculus Cup
          <div className="mx-auto mt-2 flex flex-row items-center justify-center gap-2 text-center font-light text-white/80 sm:mt-1 sm:gap-4 md:mt-0">
            <span className="rounded-lg bg-black/20 px-1.5 py-1 text-sm backdrop-blur sm:px-2 sm:py-1.5 sm:text-sm md:px-4 md:py-2 md:text-base">
              May 5th to Sep 1st
            </span>
            <span className="rounded-lg bg-black/20 px-1.5 py-1 text-sm backdrop-blur sm:px-2 sm:py-1.5 sm:text-sm md:px-4 md:py-2 md:text-base">
              Prize Pool:{" "}
              <span className="font-bold text-[#6fff8f]">$5,000</span>
            </span>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="mx-auto mx-auto mt-[10px] flex w-full self-center text-balance rounded-xl bg-black/20 p-4 py-5 text-center text-sm font-light leading-relaxed text-blue-200 sm:text-lg md:-mt-[32px] md:p-8 md:py-12 md:py-8 md:text-lg">
          Join us and make quick predictions on topical questions. Each week, a
          few new questions will be available to forecast on. We welcome both
          new and experienced forecasters to participate. Beginners can learn
          how Metaculus works while veterans can showcase their expertise.
        </div>
        <div className="mt-2 flex w-full flex-col gap-2 text-sm sm:flex-row md:mt-4 md:gap-4 md:text-base">
          <Link
            href="#basics"
            className="flex w-full items-center justify-center rounded-xl bg-black/50 py-4 text-center text-white no-underline transition-all duration-200 hover:scale-105 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Learn More
          </Link>
          <Link
            href="/tournament/metaculus-cup/#questions"
            className="flex w-full items-center justify-center rounded-xl bg-black/50 py-4 text-center text-white no-underline transition-all duration-200 hover:scale-105 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            View Questions
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-8 flex w-full max-w-3xl flex-col space-y-4 px-4 md:space-y-8">
        <div
          id="basics"
          className="mx-auto mx-auto flex w-full flex-col gap-4 self-center rounded-xl bg-black/20 p-4 py-5 text-left text-sm font-light leading-relaxed text-blue-200 sm:text-sm md:p-8 md:py-12 md:py-8 md:text-sm"
        >
          <div className="text-xl font-semibold md:text-2xl">
            Forecasting Basics
          </div>
          <div className="mx-auto flex w-full flex-col space-y-4 text-left text-blue-400">
            Forecasting is the practice of making explicit predictions about the
            future. <br />
            <br />
            Instead of vague assertions, forecasters share:
            <ul className="mt-2 list-inside list-disc">
              <li>Specific probabilities</li>
              <li>Concrete dates</li>
              <li>Measurable outcomes</li>
            </ul>
            <p>Instead of saying:</p>
            <span className="w-fit bg-blue-300/5 px-4 py-2 italic">
              &quot;There&apos;s a big risk of recession sometime soon.&quot;
            </span>
            <p>
              —a forecaster might specify that{" "}
              <span className="italic">
                &quot;there&apos;s a 60% chance the US enters a recession in the
                next 12 months.&quot;
              </span>{" "}
              Much clearer! We might agree or disagree with them, but now we
              know how likely they think it is and when they think it&apos;ll
              happen. If ultimately they&apos;re right, we know it. If
              they&apos;re wrong, well, at least they were willing to say what
              they actually believed with clarity and accountability.
            </p>
            <p className="font-semibold">
              That&apos;s what Metaculus is all about: questions that matter to
              people, clearly defined, giving you the ability to make forecasts
              and follow up on whether they were accurate.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-blue-300/10 p-4">
              <div className="mb-1 text-base font-bold">
                Tip: Use the Community
              </div>
              <div className="text-sm">
                Check the comments and community forecasts for additional
                insights.
              </div>
            </div>
            <div className="rounded-lg bg-blue-300/10 p-4">
              <div className="mb-1 text-base font-bold">Tip: Stay Updated</div>
              <div className="text-sm">
                Return to questions to update your forecast as new data emerges.
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mx-auto flex w-full flex-col gap-4 self-center text-balance rounded-xl bg-black/20 p-4 py-5 text-center text-sm font-light leading-relaxed text-blue-200 sm:text-lg md:p-8 md:py-12 md:py-8 md:text-lg">
          <div className="mb-2 text-xl font-semibold md:text-2xl">
            How to Participate
          </div>
          <div className="mx-auto flex w-full flex-col gap-4 text-center text-sm md:flex-row md:text-left">
            <div className="flex flex-col items-center gap-2 md:items-start">
              <span className="aspect-square size-8 rounded-full bg-white/20 pt-0.5 text-center text-lg font-semibold text-white/80">
                1
              </span>
              <span>Log in or create a Metaculus account.</span>
            </div>
            <div className="flex flex-col items-center gap-2 md:items-start">
              <span className="aspect-square size-8 rounded-full bg-white/20 pt-0.5 text-center text-lg font-semibold text-white/80">
                2
              </span>
              <span>
                Browse{" "}
                <Link href="/tournament/metaculus-cup/#questions">
                  available questions
                </Link>{" "}
                for the Cup.
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 md:items-start">
              <span className="aspect-square size-8 rounded-full bg-white/20 pt-0.5 text-center text-lg font-semibold text-white/80">
                3
              </span>
              Submit your predictions before questions close.
            </div>
            <div className="flex flex-col items-center gap-2 md:items-start">
              <span className="aspect-square size-8 rounded-full bg-white/20 pt-0.5 text-center text-lg font-semibold text-white/80">
                4
              </span>
              Track your performance on the leaderboard.
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-blue-400">
          Review Metaculus&apos;s{" "}
          <Link href="/terms-of-use/">Terms of Use</Link>, including important
          rules for contest participation.
        </div>
      </div>
    </main>
  );
}
