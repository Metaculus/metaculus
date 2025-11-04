"use client";
import React from "react";

import { PostWithForecasts } from "@/types/post";

import KeyFactorsAddForm from "./key_factors_add_form";
import { useKeyFactorsCtx } from "../key_factors_context";

const KeyFactorsAddFormWithCtx: React.FC<{ post: PostWithForecasts }> = ({
  post,
}) => {
  const {
    drafts,
    setDrafts,
    factorsLimit,
    limitError,
    suggestedKeyFactors,
    setSuggestedKeyFactors,
  } = useKeyFactorsCtx();

  return (
    <KeyFactorsAddForm
      drafts={drafts}
      setDrafts={setDrafts}
      factorsLimit={factorsLimit}
      limitError={limitError}
      suggestedKeyFactors={suggestedKeyFactors}
      setSuggestedKeyFactors={setSuggestedKeyFactors}
      post={post}
    />
  );
};

export default KeyFactorsAddFormWithCtx;
