import Link from "next/link";
import { Suspense } from "react";

import StateByForecast from "@/app/(main)/experiments/elections/components/state_by_forecast";
import LoadingIndicator from "@/components/ui/loading_indicator";

export default function ElectionsEmbed() {
  return (
    <main className="mx-auto w-full max-w-[93rem] flex-1 items-stretch px-6 text-blue-700 dark:text-blue-700-dark sm:px-8 md:mt-16 md:px-12 lg:mt-20 lg:px-16">
      <Link href={"/experiments/elections"} className="no-underline">
        <div className="mx-auto w-full max-w-[68rem]">
          <div className="flex items-center justify-between gap-6 text-left">
            <div className="mb-0 mt-4 flex flex-col gap-1 sm:mb-2 md:mt-2">
              <h1 className="my-2 text-3xl tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                2024 US{" "}
                <span className="text-blue-600 dark:text-blue-600-dark">
                  Election Hub
                </span>
              </h1>
              <p className="text-base text-gray-700 dark:text-gray-700-dark">
                Explore state-by-state Metaculus forecasts for the 2024 US
                presidential election in this interactive map.
              </p>
            </div>

            <div className="mt-6 flex self-start">
              <div className="m-0 hidden max-w-[250px] items-center justify-center border-4 border-blue-500 px-3 py-2 pt-3 text-center font-['alternate-gothic-no-1-d'] text-4xl font-light tracking-[.04em] text-blue-500 no-underline antialiased dark:border-blue-500-dark dark:text-blue-500-dark lg:block lg:text-5xl">
                Metaculus
              </div>
              <div className="m-0 flex size-[64px] items-center justify-center border-4 border-blue-500 pt-1 text-center font-alternate-gothic text-5xl font-light text-blue-500 no-underline antialiased dark:border-blue-500-dark dark:text-blue-500-dark md:size-[80px] md:pt-2 md:text-6xl lg:hidden">
                M
              </div>
            </div>
          </div>

          <Suspense
            fallback={
              <LoadingIndicator className="h-8 text-gray-600 dark:text-gray-600-dark" />
            }
          >
            <StateByForecast
              isEmbed
              questionGroupId={18274}
              democratPostId={10958}
              republicanPostId={10959}
            />
          </Suspense>
        </div>
      </Link>
    </main>
  );
}
