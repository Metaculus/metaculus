"use client";

import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import KeyFactorsFeed from "../../key_factors/key_factors_feed";

type Props = {
  post: PostWithForecasts;
};

const KeyFactorsTab: FC<Props> = ({ post }) => <KeyFactorsFeed post={post} />;

export default KeyFactorsTab;
