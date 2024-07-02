import Link from "next/link";

import ForecastCard from "@/components/forecast_card";
import PostsApi from "@/services/posts";
import { SearchParams } from "@/types/navigation";

import "./styles.css";

export default async function GenerateQuestionPreview({
  params,
  searchParams,
}: {
  params: { id: number };
  searchParams: SearchParams;
}) {
  const post = await PostsApi.getPost(params.id);
  if (!post) {
    return null;
  }

  const nonInteractiveParam = searchParams["non-interactive"];

  return (
    <div
      className="flex size-full flex-col gap-8 bg-blue-100 p-4 text-gray-900 dark:bg-blue-100-dark dark:text-gray-900-dark xs:p-8 lg:p-14"
      id="id-used-by-screenshot-donot-change"
      style={{
        minHeight: "inherit",
      }}
    >
      <ForecastCard
        post={post}
        className="size-full flex-1 !bg-blue-100 hover:!shadow-none dark:!bg-blue-100-dark"
        chartTheme={{
          axis: { style: { tickLabels: { fontSize: 16 } } },
          line: { style: { data: { strokeWidth: 2 } } },
        }}
        chartHeight={300}
        nonInteractive={!!nonInteractiveParam && nonInteractiveParam === "true"}
      />
      <div className="flex items-center justify-between gap-8">
        <h4 className="text-sm font-normal lg:text-2xl">
          Based on {post.forecasts_count ?? 0} predictions by{" "}
          {post.nr_forecasters} forecasters
        </h4>
        <Link
          href="/"
          id="id-logo-used-by-screenshot-donot-change"
          className="m-0 max-w-[250px] font-alternate-gothic text-4xl font-light tracking-[.04em] no-underline antialiased lg:text-6xl"
        >
          Metaculus
        </Link>
      </div>
    </div>
  );
}
