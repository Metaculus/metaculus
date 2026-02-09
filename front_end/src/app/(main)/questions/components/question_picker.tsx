import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import BaseModal from "@/components/base_modal";
import PostCard from "@/components/post_card";
import QuestionTile from "@/components/post_card/question_tile";
import SearchInput from "@/components/search_input";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { ALLOWED_COHERENCE_LINK_QUESTION_TYPES } from "@/types/coherence";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { parseQuestionId } from "@/utils/questions/helpers";

export enum SearchedQuestionType {
  Parent = "parent",
  Child = "child",
  Coherence = "coherence",
}

type Props = {
  searchedQuestionType: SearchedQuestionType;
  onQuestionChange: (question: QuestionWithForecasts) => void;
  title?: string;
  disabled?: boolean;
  divClassName?: string;
  initialSearch?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const QuestionPicker: FC<Props> = ({
  searchedQuestionType,
  onQuestionChange,
  title,
  disabled,
  divClassName,
  initialSearch = "",
  isOpen: externalIsOpen,
  onOpenChange,
}) => {
  const t = useTranslations();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);

  // Use external isOpen state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [posts, setPosts] = useState<
    (PostWithForecasts | QuestionWithForecasts)[]
  >([]);
  const filters = useMemo(() => {
    return {
      search,
      forecast_type:
        searchedQuestionType === SearchedQuestionType.Parent ||
        searchedQuestionType === SearchedQuestionType.Coherence
          ? ALLOWED_COHERENCE_LINK_QUESTION_TYPES
          : [
              QuestionType.Binary,
              QuestionType.Numeric,
              QuestionType.Discrete,
              QuestionType.Date,
            ],
      statuses: [PostStatus.OPEN, PostStatus.UPCOMING],
    };
  }, [searchedQuestionType, search]);

  const handleSearch = useDebouncedCallback(async (filters: PostsParams) => {
    try {
      if (!!filters.search) {
        setIsLoading(true);
        const allowedQuestionTypes = new Set(filters.forecast_type ?? []);
        const isAllowedQuestionType = (questionType?: QuestionType) =>
          !!questionType && allowedQuestionTypes.has(questionType);
        const parsedInput = parseQuestionId(filters.search);
        if (parsedInput.questionId) {
          const question = await ClientPostsApi.getQuestion(
            parsedInput.questionId
          );
          setPosts(isAllowedQuestionType(question.type) ? [question] : []);
        } else if (parsedInput.postId) {
          const post = await ClientPostsApi.getPost(parsedInput.postId);
          setPosts(
            "question" in post && isAllowedQuestionType(post.question?.type)
              ? [post]
              : []
          );
        }
        if (!parsedInput.questionId && !parsedInput.postId) {
          const { results: posts } = await ClientPostsApi.getPostsWithCP({
            ...filters,
            offset: 0,
            limit: 20,
          });
          setPosts(posts);
        }
      } else {
        setPosts([]);
      }
    } catch (error) {
      logError(error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    handleSearch(filters);
  }, [filters, handleSearch]);

  // Update search when initialSearch changes
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  function getQuestionTitle(questionType: SearchedQuestionType): string {
    switch (questionType) {
      case SearchedQuestionType.Parent:
        return t("parentInputDescription");
      case SearchedQuestionType.Child:
        return t("childInputDescription");
      case SearchedQuestionType.Coherence:
        return "";
      default:
        return "";
    }
  }

  function getEmptyStateMessage(): string {
    return search
      ? t("noResults")
      : "Enter a question ID or search for a question to get started";
  }

  return (
    <div className={divClassName}>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        variant="secondary"
        size="sm"
        className="my-1 px-2 py-1.5"
      >
        {t("pickQuestion")}
      </Button>
      {isOpen && (
        <BaseModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          isImmersive={true}
          className="m-0 h-full w-full max-w-none overscroll-contain rounded-none p-0 md:m-auto md:max-h-[80vh] md:max-w-3xl md:rounded md:p-5"
        >
          <div className="flex h-full flex-col bg-white dark:bg-gray-0-dark md:h-auto md:max-h-full md:bg-transparent">
            {/* Header for mobile */}
            <div className="flex items-center justify-between px-4 py-3 md:hidden">
              <h2 className="text-xl font-medium leading-7">
                {title || t("pickQuestion")}
              </h2>
              <Button
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-blue-400 bg-blue-100 p-2 dark:border-blue-400-dark dark:bg-blue-100-dark"
              >
                <FontAwesomeIcon
                  icon={faXmark}
                  className="h-4 w-4 text-blue-700 dark:text-blue-700-dark"
                />
              </Button>
            </div>

            {/* Content area */}
            <div className="flex flex-1 flex-col px-4 pb-4 md:p-0">
              <SearchInput
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onErase={() => setSearch("")}
                placeholder={t("questionSearchPlaceholder")}
                className="mb-2"
              />
              {getQuestionTitle(searchedQuestionType) && (
                <span className="mb-3 px-1 text-xs normal-case text-gray-700 dark:text-gray-700-dark">
                  {getQuestionTitle(searchedQuestionType)}
                </span>
              )}

              {/* Results area */}
              <div className="flex-1 overflow-y-auto md:min-h-0">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingIndicator />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      {getEmptyStateMessage()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {posts.map((post) =>
                      "type" in post ? (
                        <div
                          key={post.id}
                          onClick={() => {
                            onQuestionChange(post);
                            setIsOpen(false);
                          }}
                          className="cursor-pointer rounded border bg-gray-50 p-3 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
                        >
                          <h1 className="m-0 text-lg font-bold">
                            {post.title}
                          </h1>
                          <QuestionTile
                            question={post}
                            authorUsername={post.author_username}
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            curationStatus={post.status!}
                            hideCP={false}
                          />
                        </div>
                      ) : (
                        <div
                          key={post.id}
                          onClickCapture={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (post.question) {
                              onQuestionChange(post.question);
                              setIsOpen(false);
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <PostCard post={post} />
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default QuestionPicker;
