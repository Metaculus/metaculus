"use client";

import { faPercent } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useState } from "react";

import BaseModal from "@/components/base_modal";
import ForecastMaker from "@/components/forecast_maker";
import MobileAccordionModal from "@/components/forecast_maker/continuous_group_accordion/group_forecast_accordion_modal";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const QuestionPredictButton: React.FC<Props> = ({ post }) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useBreakpoint("sm");
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const handleClick = () => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (user.is_bot) {
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <Button variant="tertiary" onClick={handleClick}>
        <FontAwesomeIcon icon={faPercent} />
        {t("predict")}
      </Button>

      {!isDesktop ? (
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
          className="!h-[calc(100vh-200px)] w-full max-w-2xl"
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
