"use client";

import { faPercent } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useState } from "react";

import BaseModal from "@/components/base_modal";
import ForecastMaker from "@/components/forecast_maker";
import MobileAccordionModal from "@/components/forecast_maker/continuous_group_accordion/group_forecast_accordion_modal";
import Button from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use_media_query";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const QuestionPredictButton: React.FC<Props> = ({ post }) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 640px)");

  return (
    <>
      <Button variant="tertiary" onClick={() => setIsOpen(true)}>
        <FontAwesomeIcon icon={faPercent} />
        {t("predict")}
      </Button>

      {isMobile ? (
        <MobileAccordionModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={post.question?.title ?? ""}
        >
          <ForecastMaker
            post={post}
            onPredictionSubmit={() => setIsOpen(false)}
          />
        </MobileAccordionModal>
      ) : (
        <BaseModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          label={post.question?.title ?? ""}
          className="w-full max-w-2xl"
        >
          <ForecastMaker
            post={post}
            onPredictionSubmit={() => setIsOpen(false)}
          />
        </BaseModal>
      )}
    </>
  );
};

export default QuestionPredictButton;
