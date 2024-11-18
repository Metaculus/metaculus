"use client";

import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import { PostWithForecasts } from "@/types/post";

import "./styles.css";

type Props = {
  question: PostWithForecasts;
  expandLabel?: string;
  collapseLabel?: string;
};

const CurveQuestionDetails: FC<Props> = ({
  question,
  expandLabel: _expandLabel,
  collapseLabel: _collapseLabel,
}) => {
  const t = useTranslations();

  return (
    <div className={classNames("flex flex-col")}>
      {!!question.group_of_questions?.resolution_criteria && (
        <>
          <h3 className="m-0 mt-3 text-lg font-normal leading-5 text-blue-500 dark:text-blue-500">
            {t("resolutionCriteria")}
          </h3>
          <MarkdownEditor
            markdown={question.group_of_questions?.resolution_criteria}
            contentEditableClassName="thecurve"
          />
        </>
      )}
      {!!question.group_of_questions?.fine_print && (
        <>
          <h3 className="m-0 mt-3 text-lg font-normal leading-5 text-blue-500 dark:text-blue-500">
            {t("finePrint")}
          </h3>
          <MarkdownEditor
            markdown={question.group_of_questions?.fine_print}
            contentEditableClassName="thecurve"
          />
        </>
      )}
    </div>
  );
};

export default CurveQuestionDetails;
