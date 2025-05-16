import { notFound } from "next/navigation";

import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { PostStatus } from "@/types/post";

import CurveHeader from "../components/curve_header";
import CurveIntro from "../components/curve_intro";
import { THECURVE_TOURNAMENT_SLUG } from "../constants";

export default async function TheCurve() {
  const user = await ServerProfileApi.getMyProfile();

  const tournament = await ServerProjectsApi.getTournament(
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
      limit: tournament.questions_count,
    };

    const response = await ServerPostsApi.getPosts(tournamentFilter);
    predictedQuestions = response.results.length;
  }
  const notPredictedQuestions =
    tournament.questions_count - (predictedQuestions ?? 0);

  return (
    <>
      <CurveHeader
        layout="landing"
        notPredictedQuestions={notPredictedQuestions}
      />
      <main className="flex flex-grow justify-center">
        <CurveIntro
          tournamentSlug={THECURVE_TOURNAMENT_SLUG}
          questionNumber={tournament.questions_count}
          forecastedNumber={predictedQuestions}
        />
      </main>
    </>
  );
}
