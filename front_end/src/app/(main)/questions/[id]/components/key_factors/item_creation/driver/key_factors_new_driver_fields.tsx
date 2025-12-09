import { faCog } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/impact_direction_controls";
import { Input } from "@/components/ui/form_field";
import { ImpactMetadata } from "@/types/comment";
import { DriverDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import {
  inferEffectiveQuestionTypeFromPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import OptionTargetPicker from "./option_target_picker";
import { driverTextSchema } from "../../schemas";
import KeyFactorsNewItemContainer from "../key_factors_new_item_container";

type Props = {
  draft: DriverDraft;
  setDraft: (d: DriverDraft) => void;
  showXButton: boolean;
  onXButtonClick: () => void;
  post: PostWithForecasts;
  showErrorsSignal?: number;
};

const KeyFactorsNewDriverFields: FC<Props> = ({
  draft,
  setDraft,
  showXButton,
  onXButtonClick,
  post,
  showErrorsSignal = 0,
}) => {
  const t = useTranslations();
  const [showLocalErrors, setShowLocalErrors] = useState(false);
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

  useEffect(() => {
    if (showErrorsSignal > 0) {
      setShowLocalErrors(true);
    }
  }, [showErrorsSignal]);

  return (
    <KeyFactorsNewItemContainer
      showDeleteButton={showXButton}
      onDeleteButtonClick={onXButtonClick}
      icon={faCog}
      label={t("driver")}
    >
      <Input
        value={draft.driver.text}
        placeholder={t("driverInputPlaceholder")}
        onChange={(e) => {
          if (!showLocalErrors) setShowLocalErrors(true);
          setDraft({
            ...draft,
            driver: { ...draft.driver, text: e.target.value },
          });
        }}
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
    </KeyFactorsNewItemContainer>
  );
};

export default KeyFactorsNewDriverFields;
