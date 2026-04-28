"use client";

import { faBell as faBellRegular } from "@fortawesome/free-regular-svg-icons";
import { faEllipsis, faBell, faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { ComponentProps, FC } from "react";

import ShareIcon from "@/components/icons/share";
import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions";
import Button from "@/components/ui/button";
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

const pillVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full border text-sm font-medium leading-4 transition-colors text-blue-700 border-blue-400 bg-white dark:bg-gray-0-dark dark:border-blue-400-dark dark:text-blue-700-dark",
  {
    variants: {
      variant: {
        primary:
          "pt-2 pb-2 pr-3 pl-3.5 bg-blue-900 border-blue-900 text-white hover:bg-blue-800 active:bg-blue-950 dark:bg-blue-900-dark dark:border-blue-900-dark dark:text-gray-200-dark dark:hover:bg-blue-800-dark",
        secondary:
          "pt-2 pb-2 pr-3 pl-3.5 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-100-dark dark:active:bg-gray-200-dark",
        icon: "h-8 w-8 p-0 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-100-dark dark:active:bg-gray-200-dark",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

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
    <div
      className={cn(
        "relative w-full flex-wrap items-center gap-2 py-3",
        variant === "forecaster"
          ? "hidden md:flex"
          : "flex justify-center md:justify-start"
      )}
    >
      {/* Consumer: Predict (primary position) */}
      {variant === "consumer" && isPredictable && (
        <QuestionPredictButton
          post={post}
          className={pillVariants({ variant: "primary" })}
        />
      )}

      {/* Follow — hidden on mobile for consumer */}
      <PillButton
        variant={isFollowPrimary || isSubscribed ? "primary" : "secondary"}
        onClick={isSubscribed ? handleCustomize : handleSubscribe}
        disabled={isLoading}
        className={cn(variant === "consumer" && "hidden md:flex")}
      >
        <FontAwesomeIcon
          icon={isSubscribed ? faBell : faBellRegular}
          className={cn(
            isSubscribed
              ? "text-yellow-400 dark:text-yellow-600"
              : isFollowPrimary
                ? "text-white dark:text-gray-200-dark"
                : "text-blue-700 dark:text-blue-700-dark"
          )}
        />
        {isSubscribed ? t("followingButton") : t("followButton")}
      </PillButton>

      {/* Share */}
      <SharePostMenu
        questionId={post.id}
        questionTitle={getPostTitle(post)}
        textAlign="left"
      >
        <PillButton className="capitalize">
          <ShareIcon />
          {t("share")}
        </PillButton>
      </SharePostMenu>

      {/* Embed — hidden on mobile for consumer */}
      <PillButton
        className={cn("capitalize", variant === "consumer" && "hidden md:flex")}
        onClick={() => openEmbedModal(true)}
      >
        <FontAwesomeIcon icon={faCode} />
        {t("embed")}
      </PillButton>

      {/* Add Key Factor — forecaster only */}
      {variant === "forecaster" && (
        <AddKeyFactorsButton
          post={post}
          className={pillVariants({ variant: "secondary" })}
        />
      )}

      {/* … overflow — hidden on mobile for consumer */}
      <div
        className={cn(
          variant === "consumer"
            ? "hidden md:absolute md:right-0 md:block lg:static lg:ml-auto"
            : "ml-auto"
        )}
      >
        <PostDropdownMenu
          post={post}
          button={
            <PillButton variant="icon">
              <FontAwesomeIcon icon={faEllipsis} className="text-base" />
            </PillButton>
          }
        />
      </div>
    </div>
  );
};

export default ActionRow;

type PillButtonProps = Omit<ComponentProps<typeof Button>, "variant"> &
  VariantProps<typeof pillVariants>;

const PillButton: FC<PillButtonProps> = ({ variant, className, ...props }) => (
  <Button className={cn(pillVariants({ variant }), className)} {...props} />
);
