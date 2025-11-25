"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import { useDebouncedValue } from "@/hooks/use_debounce";
import type { ImpactMetadata } from "@/types/comment";
import type { NewsArticle } from "@/types/news";
import type { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

import KeyFactorSuggestedNewsItem from "./key_factor_suggested_news_item";
import { fetchNewsPreview, normalizeUrlForComparison } from "../../utils";
import OptionTargetPicker, { Target } from "../driver/option_target_picker";

type Props = {
  post: PostWithForecasts;
  selectedImpact: ImpactMetadata;
  target: Target;
  onTargetChange: Dispatch<SetStateAction<Target>>;
  setSelectedImpact: Dispatch<SetStateAction<ImpactMetadata>>;
  onPreviewLoaded?: (article: NewsArticle | null) => void;
  existingNewsUrls: string[];
};

const KeyFactorsPasteUrlTab: React.FC<Props> = ({
  post,
  selectedImpact,
  setSelectedImpact,
  onPreviewLoaded,
  target,
  onTargetChange,
  existingNewsUrls,
}) => {
  const t = useTranslations();

  const [url, setUrl] = useState("");
  const debouncedUrl = useDebouncedValue(url, 600);

  const [isFetching, setIsFetching] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [article, setArticle] = useState<NewsArticle | null>(null);

  const onPreviewLoadedRef = useRef(onPreviewLoaded);
  useEffect(() => {
    onPreviewLoadedRef.current = onPreviewLoaded;
  }, [onPreviewLoaded]);

  const questionType =
    post.question?.type ??
    post.group_of_questions?.questions?.[0]?.type ??
    QuestionType.Binary;

  const stopAll = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

  useEffect(() => {
    const effectiveUrl = debouncedUrl.trim();

    if (!effectiveUrl || !isProbablyUrl(effectiveUrl)) {
      setArticle(null);
      setPreviewError(null);
      setIsFetching(false);
      onPreviewLoadedRef.current?.(null);
      return;
    }

    const normalizedTyped = normalizeUrlForComparison(effectiveUrl);
    if (existingNewsUrls.includes(normalizedTyped)) {
      setArticle(null);
      setPreviewError(t("duplicateNewsUrl"));
      setIsFetching(false);
      onPreviewLoadedRef.current?.(null);
      return;
    }

    const controller = new AbortController();
    setIsFetching(true);
    setPreviewError(null);

    (async () => {
      try {
        const preview = await fetchNewsPreview(effectiveUrl, controller.signal);

        if (!preview) {
          setPreviewError(t("invalidNewsUrl"));
          setArticle(null);
          onPreviewLoadedRef.current?.(null);
          return;
        }

        const normalizedPreview = normalizeUrlForComparison(preview.url);
        if (existingNewsUrls.includes(normalizedPreview)) {
          setPreviewError(t("duplicateNewsUrl"));
          setArticle(null);
          onPreviewLoadedRef.current?.(null);
          return;
        }

        setArticle(preview);
        onPreviewLoadedRef.current?.(preview);
      } catch {
        if (controller.signal.aborted) return;

        setPreviewError(t("invalidNewsUrl"));
        setArticle(null);
        onPreviewLoadedRef.current?.(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      }
    })();

    return () => controller.abort();
  }, [debouncedUrl, t, existingNewsUrls]);

  return (
    <div className="rounded border border-blue-400 p-4 dark:border-blue-400-dark">
      <label className="mb-1 block text-xs font-medium text-blue-700 dark:text-blue-700-dark">
        URL
      </label>

      <Input
        aria-invalid={!!previewError}
        name="source"
        value={url}
        placeholder={t("pasteUrlPlaceholder")}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === " ") e.stopPropagation();
        }}
        onKeyUp={(e) => {
          if (e.key === " ") e.stopPropagation();
        }}
        className="h-10 w-full rounded-[4px] border border-blue-500 bg-transparent px-3 py-2 text-base font-normal text-blue-800 placeholder-blue-700 placeholder-opacity-50 dark:border-blue-500-dark dark:text-blue-800-dark dark:placeholder-blue-700-dark"
        errorClassName="normal-case"
      />

      {previewError && (
        <FormErrorMessage errors={previewError} containerClassName="mt-1" />
      )}

      <div className="mb-5 mt-4 space-y-2">
        {isFetching && (
          <div className="my-[20px] flex items-center justify-center gap-2 text-blue-500 dark:text-blue-500-dark">
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-[20px]"
            />
          </div>
        )}

        {article && !previewError && (
          <KeyFactorSuggestedNewsItem
            article={article}
            selected={false}
            impact={null}
            post={post}
            target={target}
            onTargetChange={onTargetChange}
            onToggleSelect={() => {}}
            onSelectImpact={() => {}}
            questionType={questionType}
            unit={post.question?.unit}
            className="cursor-default bg-gray-0 hover:bg-gray-0 dark:bg-gray-0-dark dark:hover:bg-gray-0-dark"
          />
        )}
      </div>

      <p className="mb-2 mt-4 text-xs font-medium text-blue-700 dark:text-blue-700-dark">
        {t("chooseDirectionOfImpact")}
      </p>

      <ImpactDirectionControls
        questionType={questionType}
        unit={post.question?.unit}
        impact={selectedImpact}
        onSelect={setSelectedImpact}
      />

      <div onClick={stopAll} onMouseDown={stopAll} onKeyDown={stopAll}>
        <OptionTargetPicker
          post={post}
          value={target}
          onChange={onTargetChange}
        />
      </div>
    </div>
  );
};

const isProbablyUrl = (value: string) => {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export default KeyFactorsPasteUrlTab;
