"use client";

import { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import { Input } from "@/components/ui/form_field";
import type { ImpactMetadata } from "@/types/comment";
import type { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";

type Props = {
  post: PostWithForecasts;
  url: string;
  setUrl: Dispatch<SetStateAction<string>>;
  selectedImpact: ImpactMetadata;
  setSelectedImpact: Dispatch<SetStateAction<ImpactMetadata>>;
  showError?: boolean;
};

const KeyFactorsPasteUrlTab: React.FC<Props> = ({
  post,
  url,
  setUrl,
  selectedImpact,
  setSelectedImpact,
  showError = false,
}) => {
  const t = useTranslations();

  const questionType =
    post.question?.type ??
    post.group_of_questions?.questions?.[0]?.type ??
    QuestionType.Binary;

  return (
    <div className="rounded border border-blue-400 p-4 dark:border-blue-400-dark">
      <label className="mb-1 block text-xs font-medium text-blue-700 dark:text-blue-700-dark">
        URL
      </label>

      <Input
        aria-invalid={showError}
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
        className={
          "h-10 w-full rounded-[4px] border border-blue-500 bg-transparent px-3 py-2 text-base font-normal text-blue-800 placeholder-blue-700 placeholder-opacity-50 dark:border-blue-500-dark dark:text-blue-800-dark dark:placeholder-blue-700-dark"
        }
        errorClassName="normal-case"
      />

      <p className="mb-2 mt-4 text-xs font-medium text-blue-700 dark:text-blue-700-dark">
        {t("chooseDirectionOfImpact")}
      </p>

      <ImpactDirectionControls
        questionType={questionType}
        unit={post.question?.unit}
        impact={selectedImpact}
        onSelect={setSelectedImpact}
      />
    </div>
  );
};

export default KeyFactorsPasteUrlTab;
