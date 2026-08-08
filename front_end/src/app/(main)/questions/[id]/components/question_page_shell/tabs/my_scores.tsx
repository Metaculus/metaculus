import { FC } from "react";

import PostScoreData from "@/app/(main)/questions/[id]/components/post_score_data";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const MyScoresTab: FC<Props> = ({ post }) => {
  return <PostScoreData post={post} isConsumerView noSectionWrapper />;
};

export default MyScoresTab;
