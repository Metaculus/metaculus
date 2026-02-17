import { PostWithForecasts } from "@/types/post";

type Props = {
  postData: PostWithForecasts;
};

export default function AggregationExplorerLoadedView({ postData }: Props) {
  return (
    <main className="mx-auto w-full px-4 py-8 sm:px-6">
      <section className="w-full">
        <p className="text-sm text-gray-700 dark:text-gray-700-dark">
          Loaded question:
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-900-dark sm:text-3xl">
          {postData.title}
        </h1>
      </section>
    </main>
  );
}
