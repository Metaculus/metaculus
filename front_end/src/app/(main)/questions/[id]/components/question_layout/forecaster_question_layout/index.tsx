import { PropsWithChildren } from "react";

import CommentFeed from "@/components/comment_feed";
import { PostWithForecasts } from "@/types/post";
import { getPostTitle } from "@/utils/questions/helpers";

import Sidebar from "../../sidebar";
import QuestionInfo from "../question_info";
import QuestionSection from "../question_section";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};

const ForecasterQuestionLayout: React.FC<PropsWithChildren<Props>> = ({
  children,
  postData,
  preselectedGroupQuestionId,
}) => {
  return (
    <div className="relative z-10 flex w-full flex-col gap-4">
      <QuestionSection>
        {children}
        <QuestionInfo
          postData={postData}
          preselectedGroupQuestionId={preselectedGroupQuestionId}
          showTimeline={false}
          showKeyFactors={true}
        />
      </QuestionSection>
      <Sidebar
        postData={postData}
        layout="mobile"
        questionTitle={getPostTitle(postData)}
      />
      <CommentFeed postData={postData} />
    </div>
  );
};

export default ForecasterQuestionLayout;
