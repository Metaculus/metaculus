import {
  faChartArea,
  faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode, Suspense } from "react";

import { BasicQuestionContent } from "@/app/(main)/labor-hub/components/question_cards/basic_question";
import { FlippableQuestionCard } from "@/app/(main)/labor-hub/components/question_cards/flippable_question_card";
import { NoQuestionPlaceholder } from "@/app/(main)/labor-hub/components/question_cards/placeholder";
import {
  QuestionCard,
  QuestionCardSkeleton,
} from "@/app/(main)/labor-hub/components/question_cards/question_card";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { QuestionWithForecasts } from "@/types/question";

import ConsumerTileClient from "./consumer_tile_client";

type Props = {
  questionId: number;
  fallbackTitle: string;
  contextNote?: ReactNode;
};

const CARD_BODY_HEIGHT = 140;
const CONSUMER_TILE_SCALE = 1.25;

async function WatchCardContent({ questionId, fallbackTitle }: Props) {
  let postData;
  try {
    postData = await ServerPostsApi.getPost(questionId, true);
  } catch {
    return (
      <QuestionCard
        title={fallbackTitle}
        variant="secondary"
        postIds={[questionId]}
      >
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }

  const question = postData.question as QuestionWithForecasts | undefined;

  return (
    <FlippableQuestionCard
      title={postData.title}
      variant="secondary"
      postIds={[postData.id]}
      defaultSide="left"
      leftIcon={faChartArea}
      rightIcon={faClockRotateLeft}
      leftContent={
        <div
          className="flex w-full items-center justify-center overflow-hidden"
          style={{ height: CARD_BODY_HEIGHT }}
        >
          {question ? (
            <div
              style={{
                transform: `scale(${CONSUMER_TILE_SCALE})`,
                transformOrigin: "center",
              }}
            >
              <ConsumerTileClient question={question} />
            </div>
          ) : (
            <NoQuestionPlaceholder />
          )}
        </div>
      }
      rightContent={
        <div
          className="w-full [&>*]:h-full [&_.recharts-responsive-container]:!h-full"
          style={{ height: CARD_BODY_HEIGHT }}
        >
          <BasicQuestionContent
            postData={postData}
            preferTimeline
            chartHeight={CARD_BODY_HEIGHT}
          />
        </div>
      }
    />
  );
}

export default function WatchCard(props: Props) {
  return (
    <Suspense fallback={<QuestionCardSkeleton variant="secondary" />}>
      <WatchCardContent {...props} />
    </Suspense>
  );
}
