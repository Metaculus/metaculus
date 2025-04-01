import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import RichText from "@/components/rich_text";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/cn";
import { getPostLink } from "@/utils/navigation";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
  isGroupOfQuestionsPost,
  isQuestionPost,
  isMultipleChoicePost,
} from "@/utils/questions";

import ConsumerKeyFactor from "./key_factor";
import ConsumerPredictionInfo from "./prediction_info";

type Props = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
};

const ConsumerPostCard: FC<Props> = ({ post, forCommunityFeed }) => {
  const { title, key_factors } = post;

  const t = useTranslations();
  const isShortTitle = title.length < 100;
  const forecastAvailability = getPostForecastAvailability(post);
  const isGroupOrMCPost =
    isGroupOfQuestionsPost(post) || isMultipleChoicePost(post);

  return (
    <div>
      {!isNil(forCommunityFeed) &&
        forCommunityFeed !==
          (post.projects.default_project.type === TournamentType.Community) && (
          <CommunityDisclaimer
            project={post.projects.default_project}
            variant="inline"
          />
        )}
      <Link
        href={getPostLink(post)}
        className={
          "flex flex-col items-center overflow-hidden rounded border border-blue-400 bg-gray-0 p-6 no-underline @container dark:border-blue-400-dark dark:bg-gray-0-dark"
        }
      >
        <div
          className={cn(
            "flex w-full flex-col items-center justify-between gap-4 @[500px]:flex-row @[500px]:gap-2",
            {
              "@[500px]:flex-col @[500px]:gap-4":
                isGroupOrMCPost && !forecastAvailability?.cpRevealsOn,
            }
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-4 @[500px]:items-start @[500px]:gap-2",
              {
                "@[500px]:w-full": isGroupOrMCPost,
              }
            )}
          >
            <h4 className="m-0 max-w-xl text-center text-base font-medium @[500px]:text-left">
              {title}
            </h4>
            {[PostStatus.PENDING_RESOLUTION, PostStatus.CLOSED].includes(
              post.status
            ) && (
              <p className="m-0 text-center text-xs font-normal leading-4 text-gray-1000 text-opacity-50 @[500px]:text-left dark:text-gray-1000-dark dark:text-opacity-50">
                {isGroupOrMCPost ? (
                  <RichText>
                    {(tags) =>
                      t.rich("closedForForecastingGroupDescription", {
                        ...tags,
                        br: () => <br className="@[500px]:hidden" />,
                      })
                    }
                  </RichText>
                ) : (
                  t("closedForForecastingDescription")
                )}
              </p>
            )}
            {key_factors && (
              <ConsumerKeyFactor
                keyFactor={key_factors}
                className={cn("mt-2 hidden w-full @[500px]:mt-0", {
                  "hidden @[500px]:flex": isShortTitle,
                })}
              />
            )}
          </div>

          <ConsumerPredictionInfo
            post={post}
            forecastAvailability={forecastAvailability}
          />
        </div>
        {key_factors && (
          <ConsumerKeyFactor
            keyFactor={key_factors}
            className={cn("mt-4 flex w-full @[500px]:mt-5", {
              "@[500px]:hidden": isShortTitle,
            })}
          />
        )}
      </Link>
    </div>
  );
};

function getPostForecastAvailability(post: PostWithForecasts) {
  if (isQuestionPost(post)) {
    return getQuestionForecastAvailability(post.question);
  } else if (isGroupOfQuestionsPost(post)) {
    return getGroupForecastAvailability(post.group_of_questions.questions);
  }
  return null;
}

export default ConsumerPostCard;
