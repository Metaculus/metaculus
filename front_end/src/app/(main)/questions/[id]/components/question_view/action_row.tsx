"use client";

import { faBell as faBellRegular } from "@fortawesome/free-regular-svg-icons";
import { faEllipsis, faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import EmbedIcon from "@/components/icons/embed";
import PredictIcon from "@/components/icons/predict";
import ShareIcon from "@/components/icons/share";
import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { usePostSubscriptionContext } from "@/contexts/post_subscription_context";
import { PostWithForecasts, PostStatus, QuestionStatus } from "@/types/post";
import cn from "@/utils/core/cn";
import {
  getPostTitle,
  isQuestionPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";
import {
  isPostPrePrediction,
  isQuestionPrePrediction,
} from "@/utils/questions/predictions";

import { AddKeyFactorsButton } from "../key_factors/add_button";
import QuestionPredictButton from "./consumer_question_view/action_buttons/question_predict_button";

const pillBase =
  "inline-flex items-center gap-2 rounded-full border text-sm font-medium leading-4 transition-colors text-[#4F6882] border-[#D7E4F2] bg-white dark:bg-gray-0-dark dark:border-blue-900/50 dark:text-gray-300-dark";

const pillSecondary = cn(
  pillBase,
  "pt-2 pb-2 pr-3 pl-3.5",
  "hover:bg-gray-100 active:bg-gray-200"
);

const pillPrimary = cn(
  pillBase,
  "pt-2 pb-2 pr-3 pl-3.5",
  "bg-[#283441] border-[#283441] text-white",
  "hover:bg-[#313d4a] active:bg-[#1f2933]",
  "dark:bg-blue-900 dark:border-blue-900 dark:text-gray-100-dark"
);

const pillIcon = cn(
  pillBase,
  "h-8 w-8 justify-center p-0",
  "hover:bg-gray-100 active:bg-gray-200"
);

/* ------------------------------------------------------------------ */
/*  ActionRow                                                         */
/* ------------------------------------------------------------------ */

type Props = {
  post: PostWithForecasts;
  variant: "forecaster" | "consumer";
};

const ActionRow: FC<Props> = ({ post, variant }) => {
  const t = useTranslations();
  const { updateIsOpen: openEmbedModal } = useEmbedModalContext();
  const { isSubscribed, isLoading, handleSubscribe, handleCustomize } =
    usePostSubscriptionContext();

  const isPredictable =
    (isQuestionPost(post) &&
      (post.question.status === QuestionStatus.OPEN ||
        isQuestionPrePrediction(post.question))) ||
    (isGroupOfQuestionsPost(post) &&
      (post.status === PostStatus.OPEN ||
        post.status === PostStatus.APPROVED)) ||
    isPostPrePrediction(post);

  const isFollowPrimary = !(variant === "consumer" && isPredictable);

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      {/* Consumer: Predict (primary position) */}
      {variant === "consumer" && isPredictable && (
        <QuestionPredictButton post={post} className={pillPrimary} />
      )}

      {/* Follow — custom local toggle using context and standard bell icon */}
      <button
        type="button"
        className={isFollowPrimary ? pillPrimary : pillSecondary}
        onClick={isSubscribed ? handleCustomize : handleSubscribe}
        disabled={isLoading}
      >
        <FontAwesomeIcon
          icon={isSubscribed ? faBell : faBellRegular}
          className={cn(
            isSubscribed
              ? "text-yellow-400 dark:text-yellow-600"
              : isFollowPrimary
                ? "text-white"
                : "text-[#4F6882]"
          )}
        />
        {isSubscribed ? t("followingButton") : t("followButton")}
      </button>

      {/* Share — using standard pill styling and extracted icon */}
      <SharePostMenu
        questionId={post.id}
        questionTitle={getPostTitle(post)}
        textAlign="left"
      >
        <button type="button" className={cn(pillSecondary, "capitalize")}>
          <ShareIcon />
          {t("share")}
        </button>
      </SharePostMenu>
      {/* Embed — custom button using custom icon */}
      <button
        type="button"
        className={cn(pillSecondary, "capitalize")}
        onClick={() => openEmbedModal(true)}
      >
        <EmbedIcon />
        {t("embed")}
      </button>

      {/* Add Key Factor — forecaster only */}
      {variant === "forecaster" && (
        <AddKeyFactorsButton post={post} className={pillSecondary} />
      )}

      {/* … overflow at the end of the row */}
      <div className="ml-auto">
        <PostDropdownMenu
          post={post}
          button={
            <button type="button" className={pillIcon}>
              <FontAwesomeIcon icon={faEllipsis} className="text-base" />
            </button>
          }
        />
      </div>
    </div>
  );
};

export default ActionRow;
