"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { fetchEmbedPosts } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import PostStatus from "@/components/post_status";
import SearchInput from "@/components/search_input";
import LoadingIndicator from "@/components/ui/loading_indicator";
import useDebounce from "@/hooks/use_debounce";
import { Post, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { formatPrediction } from "@/utils/forecasts";
import { extractPostResolution } from "@/utils/questions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onQuestionSelect: (id: number) => void;
};

const EmbedQuestionModal: FC<Props> = ({
  isOpen,
  onClose,
  onQuestionSelect,
}) => {
  const t = useTranslations();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [posts, setPosts] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const posts = await fetchEmbedPosts(debouncedSearch);
      setPosts(posts);
      setIsLoading(false);
    };

    void fetchPosts();
  }, [debouncedSearch]);

  const handlePostSelect = (id: number) => {
    onQuestionSelect(id);
    onClose();
  };

  return (
    <BaseModal label="Add Forecast" isOpen={isOpen} onClose={onClose}>
      <div className="max-h-full w-[520px] overflow-auto">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onErase={() => setSearch("")}
          placeholder={t("questionSearchPlaceholder")}
        />
        <div className="h-[60vh] max-h-[400px] overflow-auto pr-3">
          {isLoading ? (
            <LoadingIndicator className="h-8 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <div className="my-2 flex flex-col gap-2">
              {posts.map((post) => (
                <QuestionCard
                  key={post.id}
                  post={post}
                  onClick={() => handlePostSelect(post.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

const QuestionCard: FC<{ post: Post; onClick?: () => void }> = ({
  post,
  onClick,
}) => {
  const resolutionData = extractPostResolution(post);
  const withForecastData =
    !!post.question &&
    (post.question.type === QuestionType.Binary ||
      post.question.type === QuestionType.Date ||
      post.question.type === QuestionType.Numeric);

  return (
    <div
      className="flex gap-2 rounded border border-blue-500 px-4 py-3 hover:cursor-pointer dark:border-blue-600"
      onClick={onClick}
    >
      <div className="flex flex-col gap-1.5">
        <h4 className="my-0 text-gray-800 dark:text-gray-800-dark">
          {post.title}
        </h4>
        {withForecastData && (
          <PredictionInfo
            question={post.question as QuestionWithNumericForecasts}
          />
        )}
        <PostStatus post={post} resolution={resolutionData} />
      </div>
    </div>
  );
};

const PredictionInfo: FC<{ question: QuestionWithNumericForecasts }> = ({
  question,
}) => {
  const latest = question.aggregations.recency_weighted.latest;
  const prediction = latest.centers![latest.centers!.length - 1];

  return (
    <div className="flex flex-row gap-2">
      {prediction !== undefined && (
        <div className="flex flex-row gap-0.5 text-xs font-medium text-olive-700 dark:text-olive-400">
          <FontAwesomeIcon
            icon={faUserGroup}
            name="community"
            className="w-[13px]"
          />
          <span>{formatPrediction(prediction, question.type)}</span>
        </div>
      )}
    </div>
  );
};

export default EmbedQuestionModal;
