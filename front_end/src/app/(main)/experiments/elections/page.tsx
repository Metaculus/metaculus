import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";

import ShareElectionsMenu from "@/app/(main)/experiments/elections/components/share_elections_menu";
import { EmbedModalContextProvider } from "@/contexts/embed_modal_context";
import cn from "@/utils/core/cn";

import CardForecast from "./components/card_forecast";
import ElectoralConsequences from "./components/electoral_consequences";
import ExpectedElectoralVotesForecast from "./components/expected_electoral_votes_forecast";
import StateByForecast from "./components/state_by_forecast";

export const metadata: Metadata = {
  title: "2024 US Election Hub",
  description: null,
  openGraph: {
    type: "website",
  },
  twitter: {
    site: "@metaculus",
    card: "summary_large_image",
  },
};

export default async function ElectionsExperiment() {
  const t = await getTranslations();
  return (
    <EmbedModalContextProvider>
      <main className="text-extra-label-blue-700 dark:text-extra-label-blue-700-dark mx-auto mb-24 w-full max-w-[93rem] flex-1 items-stretch px-6 sm:px-8 md:mt-4 md:px-12 lg:mt-8 lg:px-16">
        <div className="mx-auto w-full max-w-[68rem]">
          <div className="flex items-center justify-between gap-6 text-left">
            <div className="my-4 flex flex-col gap-1 sm:mb-6 md:mt-2">
              <h1 className="my-2 text-3xl tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                {t.rich("2024USElectionHub", {
                  blue: (chunks) => (
                    <span className="text-blue-600 dark:text-blue-600-dark">
                      {chunks}
                    </span>
                  ),
                })}
              </h1>
              <span className="text-base text-gray-700 dark:text-gray-700-dark">
                {t("electionHubDescription")}
              </span>
            </div>

            <div className="mt-6 flex flex-row items-center gap-2 self-start md:mt-0 md:self-center">
              <ShareElectionsMenu />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Suspense fallback={<Skeleton />}>
              <CardForecast postId={6478} />
            </Suspense>
            <Suspense fallback={<Skeleton />}>
              <CardForecast postId={11245} />
            </Suspense>
          </div>

          <Suspense fallback={<Skeleton className="mt-4" />}>
            <ExpectedElectoralVotesForecast
              democratPostId={10958}
              republicanPostId={10959}
            />
          </Suspense>

          <Suspense fallback={<Skeleton className="mt-4" />}>
            <StateByForecast questionGroupId={18274} />
          </Suspense>

          <Suspense fallback={<Skeleton className="mt-4" />}>
            <ElectoralConsequences />
          </Suspense>
        </div>
      </main>
    </EmbedModalContextProvider>
  );
}

const Skeleton: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "animate-pulse rounded-lg bg-gray-0 p-4 shadow-md dark:bg-gray-0-dark",
      className
    )}
  >
    <div className="mb-2 h-4 w-2/3 rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-8 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-8 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="h-8 w-1/2 rounded bg-gray-300 dark:bg-gray-300-dark"></div>
  </div>
);
