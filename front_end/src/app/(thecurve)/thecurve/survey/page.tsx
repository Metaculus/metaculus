import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import PostsApi from "@/services/posts";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { PostStatus } from "@/types/post";

import CurveHeader from "../../components/curve_header";
import Survey from "../../components/curve_survey";
import { curveSlug } from "../../constants";

export default async function TheCurve() {
  const t = await getTranslations();
  const user = await ProfileApi.getMyProfile();

  const tournament = await ProjectsApi.getSlugTournament(curveSlug);
  if (!tournament) {
    return notFound();
  }

  if (!user) {
    redirect("/thecurve");
  }

  const tournamentFilter = {
    statuses: PostStatus.APPROVED,
    tournaments: curveSlug,
    not_forecaster_id: String(user.id),
    limit: tournament.posts_count,
  };

  const response = await PostsApi.getPostsWithCP(tournamentFilter);
  const notPredictedQuestions = response.results.length;

  if (notPredictedQuestions === 0) {
    redirect("/thecurve");
  }
  console.log("===response===");
  console.log(response);
  console.log("===response===");

  return (
    <>
      <CurveHeader
        layout="survey"
        notPredictedQuestions={notPredictedQuestions}
      />
      <main className="flex flex-grow justify-center bg-gradient-to-b from-blue-100 from-20% to-blue-200 to-50% dark:from-blue-100-dark dark:to-blue-200-dark">
        <Survey questions={response.results} />
      </main>
    </>
  );
}
