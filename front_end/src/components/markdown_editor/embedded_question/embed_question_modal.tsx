"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import BaseModal from "@/components/base_modal";
import PostStatus from "@/components/post_status";
import SearchInput from "@/components/search_input";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedValue } from "@/hooks/use_debounce";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { Post, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { extractPostResolution } from "@/utils/questions/resolution";

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
  const debouncedSearch = useDebouncedValue(search, 300);
  const [posts, setPosts] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchPosts = async () => {
        setIsLoading(true);
        const match = debouncedSearch.match(/(?:\/questions\/|^)(\d+)(?:\/|$)/);
        let posts: PostWithForecasts[] = [];

        if (match?.[1]) {
          try {
            const questionId = Number(match?.[1]);
            const question = await ClientPostsApi.getPost(questionId);
            posts = [question];
          } catch (e) {
            logError(e);
          }
        }
        if (!posts.length) {
          try {
            const { results } = await ClientPostsApi.getPostsWithCP({
              search: debouncedSearch || undefined,
              limit: debouncedSearch ? undefined : 10,
            });
            posts = results;
          } catch (e) {
            logError(e);
          }
        }

        setPosts(posts);
        setIsLoading(false);
      };

      void fetchPosts();
    }
  }, [isOpen, debouncedSearch]);

  const closeModal = () => {
    setSearch("");
    onClose();
  };

  const handlePostSelect = (id: number) => {
    onQuestionSelect(id);
    closeModal();
  };

  return (
    <BaseModal label="Add Forecast" isOpen={isOpen} onClose={closeModal}>
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
  const prediction = latest?.centers?.[0];

  return (
    <div className="flex flex-row gap-2">
      {prediction !== undefined && (
        <div className="flex flex-row gap-0.5 text-xs font-medium text-olive-700 dark:text-olive-400">
          <FontAwesomeIcon
            icon={faUserGroup}
            name="community"
            className="w-[13px]"
          />
          <span>
            {getPredictionDisplayValue(prediction, {
              questionType: question.type,
              scaling: question.scaling,
              actual_resolve_time: question.actual_resolve_time ?? null,
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default EmbedQuestionModal;
