import QuestionsApi from "@/services/questions";

export default async function Questions() {
  const questions = await QuestionsApi.getQuestionsWithoutForecasts();

  return <main className="flex">{questions.length}</main>;
}
