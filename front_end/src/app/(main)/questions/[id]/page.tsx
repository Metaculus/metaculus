import CommentFeed from "@/components/comment_feed";
import DetailedQuestionCard from "@/components/detailed_question_card";
import CommentsApi from "@/services/comments";
import QuestionsApi from "@/services/questions";

export default async function IndividualQuestion({
  params,
}: {
  params: { id: number };
}) {
  const questionData = await QuestionsApi.getQuestion(params.id);
  const commentsData = await CommentsApi.getComments({ question: params.id });

  return (
    <main className="flex flex-col gap-2 p-6">
      <h1 className="text-bold text-2xl dark:text-white">
        {questionData?.title}
      </h1>
      {questionData && <DetailedQuestionCard question={questionData} />}
      {commentsData && <CommentFeed comments={commentsData} />}
    </main>
  );
}
