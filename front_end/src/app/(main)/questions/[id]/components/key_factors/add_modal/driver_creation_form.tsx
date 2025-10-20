import { faCog, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/add_modal/impact_direction_controls";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { ImpactMetadata } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import {
  inferEffectiveQuestionTypeFromPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import OptionTargetPicker, { Target } from "../option_target_picker";

type Props = {
  keyFactor: string;
  setKeyFactor: (keyFactor: string) => void;
  impactMetadata: ImpactMetadata;
  setImpactMetadata: (m: ImpactMetadata) => void;
  showXButton: boolean;
  onXButtonClick: () => void;
  post: PostWithForecasts;
  target: Target;
  setTarget: (t: Target) => void;
};

const DriverCreationForm: FC<Props> = ({
  keyFactor,
  setKeyFactor,
  impactMetadata,
  setImpactMetadata,
  showXButton,
  onXButtonClick,
  post,
  target,
  setTarget,
}) => {
  const t = useTranslations();
  const questionTypeBase = inferEffectiveQuestionTypeFromPost(post);
  let questionType = questionTypeBase;
  let effectiveUnit = isQuestionPost(post) ? post.question.unit : undefined;

  if (isGroupOfQuestionsPost(post) && target.kind === "question") {
    const sq = post.group_of_questions.questions.find(
      (q) => q.id === target.question_id
    );
    questionType = sq?.type ?? questionTypeBase;
    effectiveUnit = sq?.unit ?? effectiveUnit;
  }

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
        value={keyFactor}
        placeholder={t("driverInputPlaceholder")}
        onChange={(e) => setKeyFactor(e.target.value)}
        className="grow rounded-none border-0 border-b border-blue-400 bg-transparent px-0 py-1 text-base text-blue-700 outline-0 placeholder:text-blue-700 placeholder:text-opacity-50 dark:border-blue-400-dark dark:text-blue-700-dark dark:placeholder:text-blue-700-dark"
      />
      <div className="mt-1">
        <div className="mb-2.5 text-xs font-medium text-blue-700 dark:text-blue-700-dark">
          {t("chooseDirectionOfImpact")}
        </div>
        {questionType && (
          <ImpactDirectionControls
            impactMetadata={impactMetadata}
            onSelect={setImpactMetadata}
            questionType={questionType}
            unit={effectiveUnit}
          />
        )}
        <OptionTargetPicker post={post} value={target} onChange={setTarget} />
      </div>
    </div>
  );
};

export default DriverCreationForm;
