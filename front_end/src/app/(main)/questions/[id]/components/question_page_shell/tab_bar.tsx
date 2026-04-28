"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import { useQuestionLayout } from "../question_layout/question_layout_context";

type TabKey =
  | "comments"
  | "key-factors"
  | "info"
  | "question-links"
  | "private-notes";

type TabDef = {
  key: TabKey;
  label: string;
  count?: number;
};

type Props = {
  post: PostWithForecasts;
  variant: "consumer" | "forecaster";
  className?: string;
};

const tabClassName = (isActive: boolean) =>
  cn(
    "border-[1.25px] border-solid rounded-full font-medium transition-colors",
    "text-base leading-6 px-[15px] py-[5px] sm:text-base sm:leading-6 sm:px-[15px] sm:py-[5px]",
    isActive
      ? "bg-blue-500/60 border-transparent text-blue-900 dark:bg-blue-500-dark/60 dark:text-blue-900-dark"
      : "bg-gray-0 border-blue-500/20 text-blue-900 dark:bg-gray-0-dark dark:border-blue-500-dark/20 dark:text-blue-900-dark"
  );

const QuestionPageShellTabBar: FC<Props> = ({ post, variant, className }) => {
  const t = useTranslations();
  const { activeTab, setActiveTab } = useQuestionLayout();

  const commentCount = post.comment_count ?? 0;
  const keyFactorsCount = post.key_factors?.length ?? 0;

  const tabs: TabDef[] =
    variant === "forecaster"
      ? [
          { key: "comments", label: t("comments"), count: commentCount },
          {
            key: "key-factors",
            label: t("keyFactors"),
            count: keyFactorsCount,
          },
          { key: "info", label: t("info") },
          { key: "question-links", label: t("questionLinks") },
          { key: "private-notes", label: t("privateNotes") },
        ]
      : [
          { key: "comments", label: t("comments"), count: commentCount },
          {
            key: "key-factors",
            label: t("keyFactors"),
            count: keyFactorsCount,
          },
          { key: "info", label: t("info") },
        ];

  const defaultValue: TabKey = "comments";
  const active =
    activeTab && tabs.some((tab) => tab.key === activeTab)
      ? activeTab
      : defaultValue;

  return (
    <Tabs
      defaultValue={defaultValue}
      value={active}
      onChange={setActiveTab}
      className={cn("bg-transparent dark:bg-transparent", className)}
    >
      <TabsList contained className="gap-[10px]">
        {tabs.map((tab) => (
          <TabsTab
            key={tab.key}
            value={tab.key}
            scrollOnSelect={false}
            dynamicClassName={tabClassName}
          >
            {tab.count !== undefined
              ? `${tab.label} (${tab.count})`
              : tab.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default QuestionPageShellTabBar;
