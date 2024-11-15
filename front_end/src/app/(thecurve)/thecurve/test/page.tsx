import { notFound, redirect } from "next/navigation";

import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";

import CurveHeader from "../../components/curve_header";
import CurveHistogramDrawer from "../../components/curve_histogram/curve_histogram_drawer";
import { curveSlug } from "../../constants";

// TODO: remove after Curve QA
export default async function CurveTest() {
  const user = await ProfileApi.getMyProfile();

  const tournament = await ProjectsApi.getSlugTournament(curveSlug);
  if (!tournament) {
    return notFound();
  }

  if (!user) {
    redirect("/thecurve");
  }

  return (
    <>
      <CurveHeader layout="survey" notPredictedQuestions={1} />
      <main className="flex flex-grow justify-center">
        <CurveHistogramDrawer postId={28398} />
      </main>
    </>
  );
}
