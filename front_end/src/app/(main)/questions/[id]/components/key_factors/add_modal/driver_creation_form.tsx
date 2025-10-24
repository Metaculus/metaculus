import { faCog, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/add_modal/impact_direction_controls";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { ImpactMetadata } from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import {
  inferEffectiveQuestionTypeFromPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import OptionTargetPicker from "../option_target_picker";
import { driverTextSchema } from "../schemas";

type Props = {
  draft: KeyFactorDraft;
  setDraft: (d: KeyFactorDraft) => void;
  showXButton: boolean;
  onXButtonClick: () => void;
  post: PostWithForecasts;
};

const DriverCreationForm: FC<Props> = ({
  draft,
  setDraft,
  showXButton,
  onXButtonClick,
  post,
}) => {
  const t = useTranslations();
  const questionTypeBase = inferEffectiveQuestionTypeFromPost(post);
  let questionType = questionTypeBase;
  let effectiveUnit = isQuestionPost(post) ? post.question.unit : undefined;

  if (isGroupOfQuestionsPost(post) && draft.question_id) {
    const sq = post.group_of_questions.questions.find(
      (q) => q.id === draft.question_id
    );
    questionType = sq?.type ?? questionTypeBase;
    effectiveUnit = sq?.unit ?? effectiveUnit;
  }

  const validationError = useMemo(() => {
    const result = driverTextSchema.safeParse(draft.driver.text);
    if (result.success) return null;
    return result.error.issues[0]?.message ?? null;
  }, [draft.driver.text]);

  return (
    <div className="flex flex-col gap-3 rounded border border-blue-500 bg-blue-100 px-5 py-4 dark:border-blue-500-dark dark:bg-blue-100-dark">
      <div className="flex justify-between">
        <div className="flex items-center gap-2 text-xs text-blue-700 opacity-50 dark:text-blue-700-dark">
          <FontAwesomeIcon icon={faCog} />
          <span className="uppercase">{t("driver")}</span>
        </div>
        {showXButton && (
          <Button variant="link" onClick={onXButtonClick}>
            <FontAwesomeIcon
              icon={faXmark}
              className="size-4 text-salmon-600 dark:text-salmon-600-dark"
            />
          </Button>
        )}
      </div>
      <Input
        value={draft.driver.text}
        placeholder={t("driverInputPlaceholder")}
        onChange={(e) =>
          setDraft({
            ...draft,
            driver: { ...draft.driver, text: e.target.value },
          })
        }
        className="grow rounded-none border-0 border-b border-blue-400 bg-transparent px-0 py-1 text-base text-blue-700 outline-0 placeholder:text-blue-700 placeholder:text-opacity-50 dark:border-blue-400-dark dark:text-blue-700-dark dark:placeholder:text-blue-700-dark"
      />
      {validationError && (
        <div className="-mt-1 text-xs text-salmon-600 dark:text-salmon-600-dark">
          {validationError}
        </div>
      )}
      <div className="mt-1">
        <div className="mb-2.5 text-xs font-medium text-blue-700 dark:text-blue-700-dark">
          {t("chooseDirectionOfImpact")}
        </div>
        {questionType && (
          <ImpactDirectionControls
            impact={
              draft.driver.certainty === -1
                ? ({ impact_direction: null, certainty: -1 } as const)
                : draft.driver.impact_direction === null
                  ? null
                  : ({
                      impact_direction: draft.driver.impact_direction as 1 | -1,
                      certainty: null,
                    } as const)
            }
            onSelect={(m: ImpactMetadata) =>
              setDraft({ ...draft, driver: { ...draft.driver, ...m } })
            }
            questionType={questionType}
            unit={effectiveUnit}
          />
        )}
        <OptionTargetPicker
          post={post}
          value={{
            question_id: draft.question_id,
            question_option: draft.question_option,
          }}
          onChange={(t) =>
            setDraft({
              driver: draft.driver,
              question_id: t.question_id,
              question_option: t.question_option,
            })
          }
        />
      </div>
    </div>
  );
};

export default DriverCreationForm;
