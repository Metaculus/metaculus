import QuestionsApi from "@/services/questions";

export default async function Questions() {
  const questions = await QuestionsApi.getQuestions();

  return <main className="mt-20 flex">{questions.length}</main>;
}
