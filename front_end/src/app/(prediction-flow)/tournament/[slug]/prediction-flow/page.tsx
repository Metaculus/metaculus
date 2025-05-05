import { notFound, redirect } from "next/navigation";

import { fetchTournamentForecastFlowPosts } from "@/app/(main)/questions/actions";
import PredictionFlowHeader from "@/app/(prediction-flow)/components/header";
import PredictionFlowPost from "@/app/(prediction-flow)/components/prediction_flow_post";
import PredictionFlowProvider, {
  FlowType,
} from "@/app/(prediction-flow)/components/prediction_flow_provider";
import ProgressSection from "@/app/(prediction-flow)/components/progress_section";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { isPostPredicted } from "@/utils/forecasts/helpers";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function PredictionFlow(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const flowType = searchParams["flow_type"] as FlowType;

  // Get tournament and user data
  const [tournament, user] = await Promise.all([
    ProjectsApi.getTournament(params.slug),
    ProfileApi.getMyProfile(),
  ]);

  // Check access
  if (!tournament) return notFound();
  if (!user || !tournament.forecasts_flow_enabled) {
    return redirect(`/tournament/${params.slug}`);
  }

  // Get posts data
  const forecastFlowPosts = await fetchTournamentForecastFlowPosts(params.slug);
  const isAlreadyParticipated = forecastFlowPosts.some((post) =>
    isPostPredicted(post)
  );

  return (
    <PredictionFlowProvider
      flowType={flowType}
      initialPosts={forecastFlowPosts}
    >
      <PredictionFlowHeader
        tournamentName={tournament.name}
        tournamentSlug={tournament.slug}
      />
      <main className="mx-auto flex min-h-screen max-w-3xl flex-grow flex-col pt-header">
        <ProgressSection />
        <PredictionFlowPost
          tournamentSlug={tournament.slug}
          isAlreadyParticipated={isAlreadyParticipated}
        />
      </main>
    </PredictionFlowProvider>
  );
}
