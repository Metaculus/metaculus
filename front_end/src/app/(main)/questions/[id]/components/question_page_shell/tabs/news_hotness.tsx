"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FC } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { NewsHotnessArticle } from "@/types/news";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

type Props = {
  post: PostWithForecasts;
};

const fmt = (value: number, digits = 4) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

const NewsHotnessTab: FC<Props> = ({ post }) => {
  const t = useTranslations();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["news-hotness", post.id],
    queryFn: () => ClientPostsApi.getNewsHotnessBreakdown(post.id),
  });

  if (isLoading) {
    return <LoadingIndicator className="mx-auto my-8 w-24" />;
  }

  if (isError || !data) {
    return (
      <div className="py-8 text-center text-base text-gray-700 dark:text-gray-700-dark">
        {t("newsHotnessError")}
      </div>
    );
  }

  const articles = data.articles;

  return (
    <div className="flex flex-col gap-4 text-blue-900 dark:text-blue-900-dark">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-base font-medium leading-6">
          {t("newsHotness")}
        </h3>
        <p className="m-0 text-sm text-gray-700 dark:text-gray-700-dark">
          {t.rich("newsHotnessDescription", {
            score: () => (
              <span className="font-semibold text-blue-800 dark:text-blue-800-dark">
                {fmt(data.news_hotness)}
              </span>
            ),
            count: articles.length,
          })}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="py-6 text-center text-base text-gray-700 dark:text-gray-700-dark">
          {t("newsHotnessNoArticles")}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-400 text-xs uppercase tracking-wide text-gray-600 dark:border-gray-400-dark dark:text-gray-600-dark">
                <th className="py-2 pr-3 font-medium">
                  {t("newsHotnessColArticle")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("newsHotnessColDistance")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("newsHotnessColRelevance")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("newsHotnessColPostCount")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("newsHotnessColCluster")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("newsHotnessColWeight")}
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  {t("newsHotnessColContribution")}
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article: NewsHotnessArticle, idx: number) => (
                <tr
                  key={`${article.id}-${idx}`}
                  className={cn(
                    "border-b border-gray-300 align-top dark:border-gray-300-dark",
                    !article.counts_towards_score &&
                      "text-gray-500 dark:text-gray-500-dark"
                  )}
                  title={
                    article.counts_towards_score
                      ? undefined
                      : t("newsHotnessDeduped")
                  }
                >
                  <td className="py-2 pr-3">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 hover:underline dark:text-blue-700-dark"
                    >
                      {article.title || article.url}
                    </a>
                    {article.media_label ? (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-500-dark">
                        · {article.media_label}
                      </span>
                    ) : null}
                    {!article.counts_towards_score ? (
                      <span className="ml-1 text-xs italic">
                        ({t("newsHotnessDedupedShort")})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmt(article.distance, 3)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmt(article.relevance)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {article.post_count}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {article.cluster_id}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmt(article.weight)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-right tabular-nums",
                      article.counts_towards_score &&
                        "font-semibold text-blue-800 dark:text-blue-800-dark"
                    )}
                  >
                    {fmt(article.contribution)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NewsHotnessTab;
