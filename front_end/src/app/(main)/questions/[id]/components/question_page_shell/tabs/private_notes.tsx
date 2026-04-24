"use client";

import { FC } from "react";

import PrivateNote from "@/components/question/private_note";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const PrivateNotesTab: FC<Props> = ({ post }) => (
  <PrivateNote post={post} hideToggle />
);

export default PrivateNotesTab;
