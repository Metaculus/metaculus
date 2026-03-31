import { PostWithForecasts } from "@/types/post";

export const extractCommunityForecast = (post: PostWithForecasts) =>
  post.question?.aggregations[post.question.default_aggregation_method].latest
    ?.centers?.[0] ?? 0.5;

export function extractKeyFactorTexts(post: PostWithForecasts): string[] {
  const texts: string[] = [];
  for (const kf of post.key_factors ?? []) {
    if (kf.driver?.text) {
      texts.push(kf.driver.text);
    } else if (kf.news?.title) {
      texts.push(kf.news.title);
    }
    if (texts.length >= 3) break;
  }
  return texts;
}
