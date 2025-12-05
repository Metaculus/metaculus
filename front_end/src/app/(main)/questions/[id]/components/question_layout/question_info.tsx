import { useTranslations } from "next-intl";

import PostScoreData from "@/app/(main)/questions/[id]/components/post_score_data";
import { CoherenceLinks } from "@/app/(main)/questions/components/coherence_links/coherence_links";
import ConditionalTimeline from "@/components/conditional_timeline";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import BackgroundInfo from "@/components/question/background_info";
import PrivateNote from "@/components/question/private_note";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import SectionToggle from "@/components/ui/section_toggle";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import HistogramDrawer from "../histogram_drawer";
import KeyFactorsQuestionSection from "../key_factors/key_factors_question_section";
import { QuestionVariantComposer } from "../question_variant_composer";
import QuestionTimeline from "../question_view/consumer_question_view/timeline";

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId: number | undefined;
  showKeyFactors?: boolean;
  showTimeline?: boolean;
};

const QuestionInfo: React.FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
  showKeyFactors,
  showTimeline,
}) => {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-2.5">
      {showTimeline && (
        <SectionToggle title={t("timeline")} defaultOpen={true}>
          <QuestionTimeline
            postData={postData}
            hideTitle={true}
            className="m-0"
          />
        </SectionToggle>
      )}

      <QuestionVariantComposer
        postData={postData}
        forecaster={<PostScoreData post={postData} />}
        consumer={
          <div className="hidden sm:block">
            <PostScoreData post={postData} isConsumerView />
          </div>
        }
      />

      <ResolutionCriteria post={postData} />
      {isConditionalPost(postData) && <ConditionalTimeline post={postData} />}

      {showKeyFactors && <KeyFactorsQuestionSection post={postData} />}

      <CoherenceLinks post={postData}></CoherenceLinks>

      <BackgroundInfo post={postData} />

      <PrivateNote post={postData} />

      <QuestionVariantComposer
        postData={postData}
        consumer={
          isGroupOfQuestionsPost(postData) &&
          postData.group_of_questions.graph_type ===
            GroupOfQuestionsGraphType.FanGraph ? (
            <SectionToggle
              defaultOpen
              id="timeline"
              wrapperClassName="hidden sm:block scroll-mt-header"
              contentWrapperClassName="space-y-4"
              title={t("timeline")}
            >
              <DetailedGroupCard
                post={postData}
                preselectedQuestionId={preselectedGroupQuestionId}
                groupPresentationOverride={
                  GroupOfQuestionsGraphType.MultipleChoiceGraph
                }
                prioritizeOpenSubquestions
                className="mt-2 overflow-hidden bg-gray-0 p-2 dark:bg-gray-0-dark"
              />
              <QuestionTimeline
                className="bg-gray-0 dark:bg-gray-0-dark"
                postData={postData}
              />
            </SectionToggle>
          ) : null
        }
        forecaster={
          isGroupOfQuestionsPost(postData) &&
          postData.group_of_questions.graph_type ===
            GroupOfQuestionsGraphType.FanGraph && (
            <DetailedGroupCard
              post={postData}
              preselectedQuestionId={preselectedGroupQuestionId}
              groupPresentationOverride={
                GroupOfQuestionsGraphType.MultipleChoiceGraph
              }
              prioritizeOpenSubquestions
              className="mt-2"
            />
          )
        }
      />
      <HistogramDrawer post={postData} />
    </div>
  );
};

export default QuestionInfo;
