"use client";

import { FC } from "react";

import { CoherenceLinks } from "@/app/(main)/questions/components/coherence_links/coherence_links";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const QuestionLinksTab: FC<Props> = ({ post }) => (
  <CoherenceLinks post={post} hideToggle />
);

export default QuestionLinksTab;
