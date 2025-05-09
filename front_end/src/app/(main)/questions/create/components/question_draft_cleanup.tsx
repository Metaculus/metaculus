"use client";
import { useEffect } from "react";

import { cleanupQuestionDrafts } from "@/utils/question_form_draft";

const QuestionDraftCleanup = () => {
  useEffect(() => {
    cleanupQuestionDrafts();
  }, []);

  return null;
};

export default QuestionDraftCleanup;
