import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isPostPredicted } from "@/utils/forecasts/helpers";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  posts: PostWithForecasts[];
};

const PredictionFlowMenu: FC<Props> = ({ posts }) => {
  const t = useTranslations();
  const { currentPostId, setCurrentPostId } = usePredictionFlow();

  return (
    <div className="mt-5 flex flex-col gap-2.5 overflow-y-scroll rounded-[4px] border border-blue-400 p-2 dark:border-blue-400-dark">
      {posts.map((post) => {
        const isPredicted = isPostPredicted(post);
        const isActive = currentPostId === post.id;
        return (
          <div
            key={post.id}
            className={cn(
              "flex cursor-pointer flex-col gap-2 rounded-sm border-2 border-transparent bg-blue-200 p-2.5 hover:border-blue-600 dark:bg-blue-200-dark dark:hover:border-blue-600-dark",
              {
                "border-blue-700 bg-gray-0 dark:border-blue-700-dark dark:bg-gray-0-dark":
                  isActive,
              }
            )}
            onClick={() => setCurrentPostId(post.id)}
          >
            <span className="text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
              {post.title}
            </span>
            <div className="flex flex-row gap-2">
              {/* TODO: implement prediction and question state chips */}
              <span className="flex h-5 min-w-10 items-center justify-center border border-orange-300 bg-orange-100 px-1 py-0.5 text-orange-800 dark:border-orange-300-dark dark:bg-orange-100-dark dark:text-orange-800-dark">
                -
              </span>
              {true && (
                <span className="flex items-center justify-center bg-gray-0 px-1 py-0.5 text-xs font-bold leading-4 dark:bg-gray-0-dark">
                  {isPredicted ? t("potentialyStale") : t("notForecasted")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PredictionFlowMenu;
