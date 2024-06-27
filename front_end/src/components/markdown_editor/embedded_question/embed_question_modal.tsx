"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { fetchEmbedPosts } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import PostStatus from "@/components/post_status";
import SearchInput from "@/components/search_input";
import LoadingIndicator from "@/components/ui/loading_indicator";
import useDebounce from "@/hooks/use_debounce";
import { Post } from "@/types/post";
import { extractPostStatus } from "@/utils/questions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const EmbedQuestionModal: FC<Props> = ({ isOpen, onClose }) => {
  const t = useTranslations();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [posts, setPosts] = useState<Post[]>([]);
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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="light">
      <div className="max-h-full w-[520px] overflow-auto p-7">
        <h2 className="mb-4 mr-3 mt-0 text-blue-900 dark:text-blue-900-dark">
          Add Forecast
        </h2>
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
                <QuestionCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

const QuestionCard: FC<{ post: Post }> = ({ post }) => {
  const statusData = extractPostStatus(post);

  return (
    <div className="flex gap-2 rounded border border-blue-500 px-4 py-3 dark:border-blue-600">
      <div className="flex flex-col">
        <h4 className="my-0 text-gray-800 dark:text-gray-800-dark">
          {post.title}
        </h4>
        {!!statusData && (
          <PostStatus
            id={post.id}
            status={statusData.status}
            closedAt={statusData.closedAt}
            resolvedAt={statusData.resolvedAt}
            post={post}
          />
        )}
      </div>
    </div>
  );
};

export default EmbedQuestionModal;
