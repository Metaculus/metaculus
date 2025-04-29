import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import BaseModal from "@/components/base_modal";
import PostCard from "@/components/post_card";
import QuestionTile from "@/components/post_card/question_tile";
import SearchInput from "@/components/search_input";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { PostsParams } from "@/services/posts";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";
import { parseQuestionId } from "@/utils/questions/helpers";

import { fetchPosts, getPost, getQuestion } from "../actions";

type Props = {
  isParentQuestion: boolean;
  onQuestionChange: (question: QuestionWithForecasts) => void;
  title?: string;
  disabled?: boolean;
};

const ConditionalQuestionPicker: FC<Props> = ({
  isParentQuestion,
  onQuestionChange,
  title,
  disabled,
}) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<
    (PostWithForecasts | QuestionWithForecasts)[]
  >([]);
  const filters = useMemo(() => {
    return {
      search,
      forecast_type: isParentQuestion
        ? [QuestionType.Binary]
        : [
            QuestionType.Binary,
            QuestionType.Numeric,
            QuestionType.Date,
            QuestionType.Discrete,
          ],
      statuses: [PostStatus.OPEN, PostStatus.UPCOMING],
    };
  }, [isParentQuestion, search]);

  const handleSearch = useDebouncedCallback(async (filters: PostsParams) => {
    try {
      if (!!filters.search) {
        setIsLoading(true);
        const parsedInput = parseQuestionId(filters.search);
        if (parsedInput.questionId) {
          const question = await getQuestion(parsedInput.questionId);
          setPosts([question]);
        } else if (parsedInput.postId) {
          const post = await getPost(parsedInput.postId);
          setPosts([post]);
        }
        if (!parsedInput.questionId && !parsedInput.postId) {
          const posts = await fetchPosts(filters, 0, 20);
          setPosts(posts.questions);
        }
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
  }, [filters]);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)} disabled={disabled}>
        {t("pickQuestion")}
      </Button>
      {isOpen && (
        <BaseModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          label={title}
          className="h-full w-full max-w-3xl px-3 md:h-auto"
        >
          <div className="flex h-[calc(100%-50px)] w-full flex-col md:h-auto">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onErase={() => setSearch("")}
              placeholder={t("questionSearchPlaceholder")}
            />
            <span className="mt-1 px-1 text-xs normal-case text-gray-700 dark:text-gray-700-dark">
              {isParentQuestion
                ? t("parentInputDescription")
                : t("childInputDescription")}
            </span>
            <div className="mt-2 flex min-h-[400px] flex-1 flex-col gap-2 overflow-y-scroll md:max-h-[400px]">
              {isLoading ? (
                <LoadingIndicator />
              ) : (
                <>
                  {posts.length === 0 && !!search ? (
                    <div className="text-center text-gray-500">
                      {t("noResults")}
                    </div>
                  ) : (
                    posts.map((post) =>
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
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};

export default ConditionalQuestionPicker;
