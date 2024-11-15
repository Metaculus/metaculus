import { notFound } from "next/navigation";

import PostsApi from "@/services/posts";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { PostStatus } from "@/types/post";

import CurveIntro from "../components/curve_intro";

const curveSlug = "the-curve";

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

  return (
    <main className="flex flex-grow justify-center bg-gradient-to-b from-blue-100 from-20% to-blue-200 to-50% dark:from-blue-100-dark dark:to-blue-200-dark">
      <CurveIntro
        tournamentSlug={curveSlug}
        questionNumber={tournament.posts_count}
        forecastedNumber={predictedQuestions}
      />
    </main>
  );
}
