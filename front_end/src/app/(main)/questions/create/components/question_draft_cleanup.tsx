"use client";
import { useEffect } from "react";

import { cleanupQuestionDrafts } from "@/utils/drafts/questionForm";

const QuestionDraftCleanup = () => {
  useEffect(() => {
    cleanupQuestionDrafts();
  }, []);

  return null;
};

export default QuestionDraftCleanup;
