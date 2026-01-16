import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import PredictionFlowHeader from "@/app/(prediction-flow)/components/header";
import PredictionFlowPost from "@/app/(prediction-flow)/components/prediction_flow_post";
import PredictionFlowProvider, {
  FlowType,
} from "@/app/(prediction-flow)/components/prediction_flow_provider";
import ProgressSection from "@/app/(prediction-flow)/components/progress_section";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";
import { getProjectSlug } from "@/utils/navigation";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const tournament = await ServerProjectsApi.getTournament(slug);
  const t = await getTranslations();

  if (!tournament) {
    return {};
  }

  return {
    title: `${tournament.name} | ${t("predictionFlow")}`,
  };
}

export default async function PredictionFlow(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const flowType = searchParams["flow_type"] as FlowType;

  const [tournament, user] = await Promise.all([
    ServerProjectsApi.getTournament(params.slug),
    ServerProfileApi.getMyProfile(),
  ]);

  if (!tournament) {
    return notFound();
  }
  if (
    !user ||
    !tournament.forecasts_flow_enabled ||
    tournament.timeline.all_questions_closed
  ) {
    return redirect(`/tournament/${params.slug}`);
  }

  const forecastFlowPosts = await ServerPostsApi.getTournamentForecastFlowPosts(
    params.slug
  );
  const tournamentSlug = getProjectSlug(tournament);
  return (
    <PredictionFlowProvider
      flowType={flowType}
      initialPosts={forecastFlowPosts}
    >
      <PredictionFlowHeader
        tournamentName={tournament.name}
        tournamentSlug={tournamentSlug}
      />
      <main className="mx-auto flex min-h-screen max-w-3xl flex-grow flex-col pt-header">
        <ProgressSection />
        <PredictionFlowPost tournamentSlug={tournamentSlug} />
      </main>
    </PredictionFlowProvider>
  );
}
