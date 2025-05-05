import { notFound, redirect } from "next/navigation";

import { fetchPosts } from "@/app/(main)/questions/actions";
import DetailedPost from "@/app/(prediction-flow)/components/detailed_post";
import PredictionFlowHeader from "@/app/(prediction-flow)/components/header";
import PredictionFlowProvider, {
  FlowType,
} from "@/app/(prediction-flow)/components/prediction_flow_provider";
import ProgressSection from "@/app/(prediction-flow)/components/progress_section";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { PostStatus } from "@/types/post";
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function PredictionFlow(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const flowType = searchParams["flow_type"] as FlowType;
  const tournament = await ProjectsApi.getTournament(params.slug);
  const user = await ProfileApi.getMyProfile();

  if (!tournament) {
    return notFound();
  }
  if (!user) {
    return redirect(`/tournament/${params.slug}`);
  }

  const posts = await fetchPosts(
    { statuses: PostStatus.APPROVED, tournaments: tournament.id.toString() },
    0,
    10
  );

  console.log(posts);
  return (
    <PredictionFlowProvider flowType={flowType} initialPosts={posts.questions}>
      <PredictionFlowHeader
        tournamentName={tournament.name}
        tournamentSlug={tournament.slug}
      />
      <main className="mx-auto flex min-h-screen max-w-3xl flex-grow flex-col justify-center pt-header">
        <ProgressSection tournamentId={tournament.id} />
        <DetailedPost />
      </main>
    </PredictionFlowProvider>
  );
}
