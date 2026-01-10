"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import Listbox, { SelectOption } from "@/components/ui/listbox";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
} from "@/utils/questions/helpers";

export type Target = {
  question_id?: number;
  question_option?: string;
};

type Props = {
  post: PostWithForecasts;
  value: Target;
  onChange: (t: Target) => void;
  disabled?: boolean;
  className?: string;
};

const OptionTargetPicker: FC<Props> = ({
  post,
  value,
  onChange,
  disabled,
  className,
}) => {
  const t = useTranslations();

  const isMC = isMultipleChoicePost(post);
  const isGroup = isGroupOfQuestionsPost(post);

  const optionClassName =
    "h-8 text-[13px] text-gray-800 dark:text-gray-800-dark text-left justify-start";
  const placeholder = isMC ? t("allOptions") : t("allSubquestions");
  const options: SelectOption<string>[] = useMemo(() => {
    if (isMC) {
      const mcOptions = (post.question.options ?? []).map((opt) => ({
        value: opt,
        label: opt,
        className: optionClassName,
      }));
      return [
        { value: "", label: placeholder, className: optionClassName },
        ...mcOptions,
      ];
    }
    if (isGroup) {
      const groupOptions = post.group_of_questions.questions.map(
        (q: QuestionWithForecasts) => ({
          value: String(q.id),
          label: q.label || q.title,
          className: optionClassName,
        })
      );
      return [
        { value: "", label: placeholder, className: optionClassName },
        ...groupOptions,
      ];
    }
    return [];
  }, [isMC, isGroup, post, placeholder]);

  if (!isMC && !isGroup) return null;

  const selectedLabel = isMC
    ? value.question_option || placeholder
    : isGroup
      ? value.question_id
        ? options.find((o) => o.value === String(value.question_id))?.label ??
          ""
        : placeholder
      : placeholder;

  const currentValue = isMC
    ? value.question_option ?? ""
    : isGroup
      ? value.question_id
        ? String(value.question_id)
        : ""
      : "";

  return (
    <div className={cn("mt-3 flex flex-col gap-1.5", className)}>
      <div className="text-xs font-medium text-blue-700 dark:text-blue-700-dark">
        {isMC
          ? t("chooseOptionImpactedMost")
          : t("chooseSubquestionImpactedMost")}
      </div>

      <Listbox<string>
        options={options}
        value={currentValue as string}
        onChange={(v) => {
          if (!v) return onChange({});
          if (isMC)
            return onChange({
              question_id: post.question.id,
              question_option: v,
            });
          return onChange({ question_id: Number(v) });
        }}
        label={selectedLabel || placeholder}
        buttonVariant="tertiary"
        arrowPosition="right"
        menuPosition="left"
        disabled={disabled}
        renderInPortal
        preventParentScroll
        menuMinWidthMatchesButton={false}
        className="gap-1.5 rounded-[2px] p-1.5 text-xs leading-[12px]"
        optionsClassName="mt-1.5"
      />
    </div>
  );
};

export default OptionTargetPicker;
