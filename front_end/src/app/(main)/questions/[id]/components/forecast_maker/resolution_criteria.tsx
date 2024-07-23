import { useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import ExpandableContent from "@/components/ui/expandable_content";

export type ResolutionCriteriaData = {
  title: string;
  questionTitle?: string;
  content: string | null;
  finePrint: string | null;
};

const ResolutionCriteria: FC<ResolutionCriteriaData> = ({
  title,
  questionTitle,
  content,
  finePrint,
}) => {
  const t = useTranslations();

  return (
    <ExpandableContent
      expandLabel={t("showMore")}
      collapseLabel={t("showLess")}
      gradientClassName="from-blue-200 dark:from-blue-200-dark"
    >
      <h3 className="m-0 text-base font-normal leading-5 opacity-70">
        {title}
      </h3>
      {questionTitle && (
        <h4 className="mb-0 font-sans italic">{questionTitle}</h4>
      )}
      <div className="content prediction-section-resolution-criteria">
        {!!content && <MarkdownEditor markdown={content} />}
        {!!finePrint && (
          <div>
            <h3 className="text-base font-normal leading-5 opacity-70">
              {t("finePrint")}
            </h3>
            <MarkdownEditor
              markdown={finePrint}
              contentEditableClassName="!font-sans opacity-70"
            />
          </div>
        )}
      </div>
    </ExpandableContent>
  );
};

export default ResolutionCriteria;
