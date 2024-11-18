import { notFound } from "next/navigation";

import PostsApi from "@/services/posts";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { PostStatus } from "@/types/post";

import CurveHeader from "../components/curve_header";
import CurveIntro from "../components/curve_intro";
import { THECURVE_TOURNAMENT_SLUG } from "../constants";

export default async function TheCurve() {
  const user = await ProfileApi.getMyProfile();

  const tournament = await ProjectsApi.getSlugTournament(
    THECURVE_TOURNAMENT_SLUG
  );
  if (!tournament) {
    return notFound();
  }

  let predictedQuestions = undefined;
  if (user) {
    const tournamentFilter = {
      statuses: PostStatus.APPROVED,
      tournaments: THECURVE_TOURNAMENT_SLUG,
      forecaster_id: String(user.id),
      limit: tournament.posts_count,
    };

    const response = await PostsApi.getPosts(tournamentFilter);
    predictedQuestions = response.results.length;
  }
  const notPredictedQuestions =
    tournament.posts_count - (predictedQuestions ?? 0);

  return (
    <>
      <CurveHeader
        layout="landing"
        notPredictedQuestions={notPredictedQuestions}
      />
      <main className="flex flex-grow justify-center">
        <CurveIntro
          tournamentSlug={THECURVE_TOURNAMENT_SLUG}
          questionNumber={tournament.posts_count}
          forecastedNumber={predictedQuestions}
        />
      </main>
    </>
  );
}
