import { notFound } from "next/navigation";

import PostsApi from "@/services/posts";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { PostStatus } from "@/types/post";

import CurveHeader from "../components/curve_header";
import CurveIntro from "../components/curve_intro";
import { curveSlug } from "../constants";

export default async function TheCurve() {
  const user = await ProfileApi.getMyProfile();

  const tournament = await ProjectsApi.getSlugTournament(curveSlug);
  if (!tournament) {
    return notFound();
  }

  let predictedQuestions = undefined;
  if (user) {
    const tournamentFilter = {
      statuses: PostStatus.APPROVED,
      tournaments: curveSlug,
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
      <main className="flex flex-grow justify-center bg-gradient-to-b from-blue-100 from-20% to-blue-200 to-50% dark:from-blue-100-dark dark:to-blue-200-dark">
        <CurveIntro
          tournamentSlug={curveSlug}
          questionNumber={tournament.posts_count}
          forecastedNumber={predictedQuestions}
        />
      </main>
    </>
  );
}
