import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/button";
import { SearchParams } from "@/types/navigation";

import Explorer from "./components/explorer";

export default async function AggregationExplorer(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const t = await getTranslations();
  const isQuestionSelectState =
    !searchParams.post_id && !searchParams.question_id && !searchParams.option;

  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
      {isQuestionSelectState ? (
        <h1 className="mb-5 mt-20 text-balance text-center text-4xl text-blue-800 dark:text-blue-800-dark sm:text-5xl sm:tracking-tight md:text-6xl">
          {t("aggregationExplorer")}
        </h1>
      ) : (
        <div className="mb-4 mt-6 flex items-center gap-2 sm:mt-8">
          <Button
            href="/aggregation-explorer"
            variant="text"
            className="px-2 text-xl leading-none"
            aria-label="Back to question selector"
          >
            {"<-"}
          </Button>
          <h1 className="text-xl font-semibold text-blue-800 dark:text-blue-800-dark sm:text-2xl">
            {t("aggregationExplorer")}
          </h1>
        </div>
      )}
      <Explorer searchParams={searchParams} />
    </main>
  );
}
