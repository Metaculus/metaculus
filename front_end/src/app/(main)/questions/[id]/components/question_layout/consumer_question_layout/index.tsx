import { useTranslations } from "next-intl";
import { PropsWithChildren, Suspense } from "react";

import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import {
  Tabs,
  TabsList,
  TabsSection,
  TabsTab,
} from "@/components/ui/tabs/index";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { isGroupOfQuestionsPost } from "@/utils/questions/helpers";

import QuestionTimeline, {
  hasTimeline as hasTimelineFn,
} from "../../question_view/consumer_question_view/timeline";
import NewsMatch from "../../sidebar/news_match";
import NewsPresence from "../../sidebar/news_match/news_presence";
import QuestionInfo from "../question_info";
import QuestionSection from "../question_section";
import ResponsiveCommentFeed from "./responsive_comment_feed";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
};
const ConsumerQuestionLayout: React.FC<PropsWithChildren<Props>> = ({
  children,
  preselectedGroupQuestionId,
  postData,
}) => {
  const t = useTranslations();
  const hasTimeline = hasTimelineFn(postData);

  const isFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;

  return (
    <div className="relative z-10 flex w-full flex-col gap-4">
      <QuestionSection compact>
        {children}
        <div className="sm:hidden">
          <Tabs defaultValue="comments" className="-mb-5">
            <TabsList>
              <TabsTab value="comments">{t("comments")}</TabsTab>
              {hasTimeline && (
                <TabsTab value="timeline">{t("timeline")}</TabsTab>
              )}
              <NewsPresence questionId={postData.id}>
                <TabsTab value="news">{t("inNews")}</TabsTab>
              </NewsPresence>
              <TabsTab value="info">{t("info")}</TabsTab>
            </TabsList>

            <TabsSection value="comments">
              <ResponsiveCommentFeed compactVersion postData={postData} />
            </TabsSection>
            {hasTimeline && (
              <TabsSection className="space-y-4" value="timeline">
                {isGroupOfQuestionsPost(postData) && (
                  <DetailedGroupCard
                    post={postData}
                    preselectedQuestionId={preselectedGroupQuestionId}
                    groupPresentationOverride={
                      GroupOfQuestionsGraphType.MultipleChoiceGraph
                    }
                    prioritizeOpenSubquestions
                    className="mt-2"
                  />
                )}
                <QuestionTimeline
                  className="block"
                  postData={postData}
                  hideTitle
                />
              </TabsSection>
            )}
            <NewsPresence questionId={postData.id}>
              <TabsSection value="news">
                <Suspense fallback={null}>
                  <NewsMatch questionId={postData.id} withoutToggle />
                </Suspense>
              </TabsSection>
            </NewsPresence>
            <TabsSection value="info">
              <QuestionInfo
                postData={postData}
                preselectedGroupQuestionId={preselectedGroupQuestionId}
                showKeyFactors={false}
                showTimeline={false}
              />
            </TabsSection>
          </Tabs>
        </div>
        <div className="hidden sm:block">
          <QuestionInfo
            postData={postData}
            preselectedGroupQuestionId={preselectedGroupQuestionId}
            showKeyFactors={false}
            showTimeline={!isFanGraph}
          />
        </div>
      </QuestionSection>
      <div className="hidden lg:block">
        <ResponsiveCommentFeed postData={postData} />
      </div>
    </div>
  );
};

export default ConsumerQuestionLayout;
