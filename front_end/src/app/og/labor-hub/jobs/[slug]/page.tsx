import { notFound } from "next/navigation";

import { getJobBySlug } from "@/app/(main)/labor-hub/data";
import {
  fetchJobsData,
  getJobValueForYear,
} from "@/app/(main)/labor-hub/helpers/fetch_jobs_data";
import { ShareCardPreview } from "@/app/(main)/labor-hub/jobs/components/share_card_preview";
import {
  WALL_YEARS,
  type WallYear,
} from "@/app/(main)/labor-hub/jobs/helpers/wall_types";

export const revalidate = 3600;

type Params = { slug: string };

export default async function OgJobSharePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  const sp = await searchParams;
  const yearParam = typeof sp.year === "string" ? sp.year : "2035";
  const year = (WALL_YEARS as readonly string[]).includes(yearParam)
    ? (yearParam as WallYear)
    : ("2035" as WallYear);

  const { jobs } = await fetchJobsData();
  const withPost = jobs.find((j) => j.post_id === job.post_id);
  const forecasts: Record<WallYear, number | null> = {
    "2027": withPost ? getJobValueForYear(withPost, "2027") : null,
    "2030": withPost ? getJobValueForYear(withPost, "2030") : null,
    "2035": withPost ? getJobValueForYear(withPost, "2035") : null,
  };

  const forecasterCount =
    withPost?.post?.group_of_questions?.questions?.[0]?.aggregations?.[
      withPost.post.group_of_questions.questions[0].default_aggregation_method
    ]?.latest?.forecaster_count ?? null;

  return (
    <div
      id="id-used-by-screenshot-donot-change"
      className="relative h-[630px] w-[1200px] overflow-hidden font-sans"
    >
      <ShareCardPreview
        jobName={job.name}
        forecasts={forecasts}
        forecasterCount={forecasterCount}
        year={year}
        fullSize
      />
      <div
        id="id-logo-used-by-screenshot-donot-change"
        className="absolute right-0 top-0 h-1 w-1 opacity-0"
      />
    </div>
  );
}
