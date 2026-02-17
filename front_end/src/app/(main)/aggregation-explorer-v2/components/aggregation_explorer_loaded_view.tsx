import Button from "@/components/ui/button";
import { PostWithForecasts } from "@/types/post";

type Props = {
  postData: PostWithForecasts;
};

export default function AggregationExplorerLoadedView({ postData }: Props) {
  return (
    <main className="mx-auto w-full px-4 py-8 lg:px-20">
      <section className="mx-auto w-full max-w-[1352px]">
        <Button href="/aggregation-explorer-v2" variant="text" className="px-0">
          {"<- Aggregation Explorer"}
        </Button>
        <h1 className="mt-1 text-balance text-2xl font-semibold text-blue-900 dark:text-blue-900-dark sm:text-3xl">
          {postData.title}
        </h1>
        <div className="flex w-[48rem] max-w-full flex-col gap-5 overflow-x-hidden rounded border-transparent bg-gray-0 p-4 text-gray-900 dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark lg:gap-6 lg:border lg:p-8">
          post card
        </div>
      </section>
    </main>
  );
}
