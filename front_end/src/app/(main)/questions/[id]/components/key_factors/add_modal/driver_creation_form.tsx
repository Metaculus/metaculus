import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import ImpactDirectionControls from "@/app/(main)/questions/[id]/components/key_factors/add_modal/impact_direction_controls";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { ImpactMetadata } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import {
  inferEffectiveQuestionTypeFromPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  keyFactor: string;
  setKeyFactor: (keyFactor: string) => void;
  isActive: boolean;
  showXButton: boolean;
  onXButtonClick: () => void;
  post: PostWithForecasts;
};

const DriverCreationForm: FC<Props> = ({
  keyFactor,
  setKeyFactor,
  isActive,
  showXButton,
  onXButtonClick,
  post,
}) => {
  const t = useTranslations();
  const [impactMetadata, setImpactMetadata] = useState<ImpactMetadata>({
    impact_direction: null,
    certainty: null,
  });
  const questionType = inferEffectiveQuestionTypeFromPost(post);
  const unit = isQuestionPost(post) ? post.question.unit : undefined;

  return (
    <div className="flex flex-col gap-3 rounded border border-blue-500 bg-blue-100 px-5 py-4 dark:border-blue-500-dark dark:bg-blue-100-dark">
      <div className="flex items-center gap-2 text-xs text-blue-700 opacity-50 dark:text-blue-700-dark">
        <FontAwesomeIcon icon={faCog} />
        <span className="uppercase">{t("driver")}</span>
      </div>
      <Input
        value={keyFactor}
        placeholder={t("driverInputPlaceholder")}
        onChange={(e) => setKeyFactor(e.target.value)}
        className="grow rounded-none border-0 border-b border-blue-400 bg-transparent px-0 py-1 text-base text-blue-700 outline-0 placeholder:text-blue-700 placeholder:text-opacity-50 dark:border-blue-400-dark dark:text-blue-700-dark dark:placeholder:text-blue-700-dark"
        readOnly={!isActive}
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
            unit={unit}
          />
        )}
      </div>
      {showXButton && (
        <Button
          variant="text"
          size="xs"
          className="w-fit"
          onClick={onXButtonClick}
        >
          <FontAwesomeIcon icon={faCircleXmark} className="size-4 p-1" />
        </Button>
      )}
    </div>
  );
};

export default DriverCreationForm;
