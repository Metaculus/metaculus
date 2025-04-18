"use client";
import { useEffect } from "react";

import { cleanupQuestionDrafts } from "@/utils/questions";

const QuestionDraftCleanup = () => {
  useEffect(() => {
    cleanupQuestionDrafts();
  }, []);
  return null;
};

export default QuestionDraftCleanup;
