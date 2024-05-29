import QuestionsApi from "@/services/questions";

export default async function Questions() {
  const questions = await QuestionsApi.getQuestions();

  return <main className="flex mt-20">{questions.length}</main>;
}
