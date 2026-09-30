import { BasicQuestionContent } from "@/app/(main)/labor-hub/components/question_cards/basic_question";
import { FlippableQuestionCard } from "@/app/(main)/labor-hub/components/question_cards/flippable_question_card";
import { NoQuestionPlaceholder } from "@/app/(main)/labor-hub/components/question_cards/placeholder";
import {
  getLeftIcon,
  getRightIcon,
} from "@/app/(main)/labor-hub/components/question_cards/question";
import { QuestionCard } from "@/app/(main)/labor-hub/components/question_cards/question_card";
import ConsumerTileClient from "@/app/(main)/midterms-2026/components/consumer_tile_client";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import { CardChange } from "./card_change";
import { GhmValueKey } from "../config/questions";

const CHART_HEIGHT = 180;
const TILE_SCALE = 1.2;

function SnapshotView({ post }: { post: PostWithForecasts }) {
  const question = post.question as QuestionWithForecasts | undefined;

  // The question-page prediction views scale up on desktop and overflow a card, so
  // single questions use the compact consumer tile (as Midterms' WatchCard does).
  if (question && question.type !== QuestionType.MultipleChoice) {
    return (
      <div
        className="flex w-full items-center justify-center overflow-hidden"
        style={{ height: CHART_HEIGHT }}
      >
        <div
          style={{
            transform: `scale(${TILE_SCALE})`,
            transformOrigin: "center",
          }}
        >
          <ConsumerTileClient question={question} />
        </div>
      </div>
    );
  }

  return <BasicQuestionContent postData={post} chartHeight={CHART_HEIGHT} />;
}

export function GhmQuestionCard({
  postId,
  post,
  value,
  className,
}: {
  postId: number;
  post: PostWithForecasts | undefined;
  value?: GhmValueKey;
  className?: string;
}) {
  if (!post) {
    return (
      <QuestionCard postIds={[postId]} className={className}>
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }

  return (
    <FlippableQuestionCard
      title={post.title}
      variant="secondary"
      postIds={[post.id]}
      className={className}
      subheader={value ? <CardChange value={value} /> : undefined}
      leftIcon={getLeftIcon(post)}
      rightIcon={getRightIcon(post)}
      leftContent={<SnapshotView post={post} />}
      rightContent={
        <BasicQuestionContent
          postData={post}
          preferTimeline
          chartHeight={CHART_HEIGHT}
        />
      }
    />
  );
}
