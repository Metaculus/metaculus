import { useTranslations } from "next-intl";

import ConditionalChart from "@/components/conditional_tile/conditional_chart";
import { useHideCP } from "@/contexts/cp_context";
import { ConditionalPost } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

import { EmbedTheme } from "../constants/embed_theme";

type Props = {
  post: ConditionalPost<QuestionWithNumericForecasts>;
  theme?: EmbedTheme;
};

const EmbedConditionalPlot = ({ post, theme }: Props) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const { condition, condition_child, question_yes, question_no } =
    post.conditional;

  return (
    <div className="flex min-w-0 flex-col gap-3 @container">
      <div className="border border-blue-500 p-3 dark:border-blue-500-dark">
        <div className="mb-1 text-xs font-semibold uppercase text-blue-700 dark:text-blue-700-dark">
          {t("condition")}
        </div>
        <div className="text-sm font-medium">
          {condition.short_title || condition.title}
        </div>
      </div>
      <div className="text-sm font-medium">
        {condition_child.short_title || condition_child.title}
      </div>
      <div className="grid grid-cols-1 gap-3 @[480px]:grid-cols-2">
        {[
          { label: t("ifYes"), question: question_yes },
          { label: t("ifNo"), question: question_no },
        ].map(({ label, question }) => (
          <section
            key={question.id}
            aria-label={label}
            className="min-w-0 border border-blue-400 p-3 dark:border-blue-400-dark"
          >
            <div className="mb-2 text-xs font-semibold uppercase text-blue-700 dark:text-blue-700-dark">
              {label}
            </div>
            <ConditionalChart
              question={question}
              disabled={isUnsuccessfullyResolved(question.resolution)}
              chartTheme={theme?.chart}
              hideCP={hideCP}
            />
          </section>
        ))}
      </div>
    </div>
  );
};

export default EmbedConditionalPlot;
