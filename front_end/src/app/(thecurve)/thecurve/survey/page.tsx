import { notFound, redirect } from "next/navigation";

import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { PostStatus } from "@/types/post";

import CurveHeader from "../../components/curve_header";
import Survey from "../../components/curve_survey";
import { THECURVE_TOURNAMENT_SLUG } from "../../constants";

export default async function TheCurve() {
  const user = await ServerProfileApi.getMyProfile();

  const tournament = await ServerProjectsApi.getTournament(
    THECURVE_TOURNAMENT_SLUG
  );
  if (!tournament) {
    return notFound();
  }

  if (!user) {
    redirect("/thecurve");
  }

  const tournamentFilter = {
    statuses: PostStatus.APPROVED,
    tournaments: THECURVE_TOURNAMENT_SLUG,
    not_forecaster_id: String(user.id),
    limit: tournament.questions_count,
  };

  const response = await ServerPostsApi.getPostsWithCP(tournamentFilter);
  const notPredictedQuestions = response.results.length;

  if (notPredictedQuestions === 0) {
    redirect("/thecurve");
  }
  const mixedQuestions = [...response.results].sort(() => Math.random() - 0.5);

  return (
    <>
      <CurveHeader
        layout="survey"
        notPredictedQuestions={notPredictedQuestions}
      />
      <main className="flex w-[100vw] max-w-[780px] flex-grow justify-center md:my-5">
        <Survey questions={mixedQuestions} />
      </main>
    </>
  );
}
