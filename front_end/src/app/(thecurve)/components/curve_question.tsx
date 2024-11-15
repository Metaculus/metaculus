import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import CurveQuestionDetails from "./question_details/curve_question_details";

type Props = {
  post: PostWithForecasts;
};

const CurveQuestion: FC<Props> = ({ post }) => {
  return (
    <div className="w-full">
      <div className="relative max-h-[calc(100vh-48px)] w-full overflow-y-auto bg-blue-800 p-5 pb-3 md:rounded-t">
        <h1 className="m-0 text-2xl font-medium leading-8 text-gray-100">
          {post.title}
        </h1>
        <CurveQuestionDetails question={post} />
      </div>
    </div>
  );
};

export default CurveQuestion;
