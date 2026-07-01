"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import useAppTheme from "@/hooks/use_app_theme";
import { ContinuousAreaGraphType } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import { isGroupOfQuestionsPost } from "@/utils/questions/helpers";

import {
  getDistributionColor,
  getSubquestionDistributionData,
  hasSubquestionDistribution,
} from "../../question_view/consumer_question_view/group_distribution_utils";

type Props = {
  post: PostWithForecasts;
};

const subTabClassName = (isActive: boolean) =>
  cn(
    "border-[1.25px] border-solid rounded-full font-medium transition-colors",
    "text-sm leading-4 px-2 py-1 sm:text-base sm:leading-6 sm:px-[15px] sm:py-[5px]",
    isActive
      ? "bg-blue-500/60 border-transparent text-blue-900 dark:bg-blue-500-dark/60 dark:text-blue-900-dark"
      : "bg-gray-0 border-blue-500/20 text-blue-900 dark:bg-gray-0-dark dark:border-blue-500-dark/20 dark:text-blue-900-dark"
  );

const DistributionsTab: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { getThemeColor } = useAppTheme();
  const [graphType, setGraphType] = useState<ContinuousAreaGraphType>("pmf");

  const items = useMemo(() => {
    if (!isGroupOfQuestionsPost(post)) {
      return [];
    }
    const questionsById = new Map(
      (post.group_of_questions?.questions ?? []).map((q) => [q.id, q])
    );
    return generateChoiceItemsFromGroupQuestions(post.group_of_questions, {
      locale,
    }).flatMap((choice) => {
      if (choice.id == null) {
        return [];
      }
      const question = questionsById.get(choice.id);
      if (!question || !hasSubquestionDistribution(question)) {
        return [];
      }
      return [{ id: choice.id, choice, question }];
    });
  }, [post, locale]);

  if (!isGroupOfQuestionsPost(post) || items.length === 0) {
    return null;
  }

  const groupType =
    post.group_of_questions?.questions?.[0]?.type ?? QuestionType.Numeric;
  const pdfLabel = groupType === QuestionType.Discrete ? t("pmf") : t("pdf");

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        defaultValue="pmf"
        value={graphType}
        onChange={(value) => setGraphType(value as ContinuousAreaGraphType)}
        className="bg-transparent dark:bg-transparent"
      >
        <TabsList contained className="gap-[10px]">
          <TabsTab
            value="pmf"
            scrollOnSelect={false}
            dynamicClassName={subTabClassName}
          >
            {pdfLabel}
          </TabsTab>
          <TabsTab
            value="cdf"
            scrollOnSelect={false}
            dynamicClassName={subTabClassName}
          >
            {t("cdf")}
          </TabsTab>
        </TabsList>
      </Tabs>
      <div className="flex flex-col gap-6">
        {items.map(({ id, choice, question }) => (
          <div key={id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getThemeColor(choice.color) }}
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-800-dark">
                {choice.choice}
              </span>
            </div>
            <ContinuousAreaChart
              question={question}
              data={getSubquestionDistributionData(question)}
              graphType={graphType}
              height={140}
              colorOverride={getThemeColor(
                getDistributionColor(question, choice.color)
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistributionsTab;
