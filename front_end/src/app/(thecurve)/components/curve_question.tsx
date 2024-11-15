import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import ExpandableContent from "@/components/ui/expandable_content";
import { PostWithForecasts } from "@/types/post";

type Props = {
  question: PostWithForecasts;
};

const CurveQuestion: FC<Props> = ({ question }) => {
  const t = useTranslations();

  return (
    <div className="w-full">
      <div className="w-full bg-blue-800 p-5 dark:bg-blue-800-dark">
        <h1 className="m-0 text-2xl font-medium leading-8 text-gray-100 dark:text-gray-100-dark">
          {question.title}
        </h1>
        <ExpandableContent
          expandLabel={t("showMore")}
          collapseLabel={t("showLess")}
          gradientClassName="from-blue-200 dark:from-blue-200-dark"
          maxCollapsedHeight={0}
        >
          <div className="content prediction-section-resolution-criteria">
            {!!question.group_of_questions?.resolution_criteria && (
              <MarkdownEditor
                markdown={question.group_of_questions?.resolution_criteria}
                className="!text-blue-300 dark:!text-blue-300"
              />
            )}
            {!!question.group_of_questions?.fine_print && (
              <>
                <MarkdownEditor
                  markdown={question.group_of_questions?.fine_print}
                  contentEditableClassName="!font-sans opacity-70"
                />
              </>
            )}
          </div>
        </ExpandableContent>
      </div>
    </div>
  );
};

export default CurveQuestion;
