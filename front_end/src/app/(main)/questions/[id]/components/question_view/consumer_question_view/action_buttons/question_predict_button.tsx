"use client";

import { faPercent } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import BaseModal from "@/components/base_modal";
import ForecastMaker from "@/components/forecast_maker";
import BottomDrawer from "@/components/ui/bottom_drawer";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isPostPrePrediction } from "@/utils/questions/predictions";

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const QuestionPredictButton: React.FC<Props> = ({ post, className }) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useBreakpoint("sm");
  const { user } = useAuth();
  const { currentModal } = useModal();

  // Only one surface at a time: when the maker's gate opens a global modal
  // (email capture, signup), dismiss the maker instead of stacking under it
  useEffect(() => {
    if (currentModal) {
      setIsOpen(false);
    }
  }, [currentModal]);

  const handleClick = () => {
    if (user?.is_bot) {
      return;
    }
    // Logged-out users get the forecast maker too; its submit button gates
    // into the email-capture drawer carrying the drafted forecast
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant="tertiary"
        onClick={handleClick}
        className={cn("px-4 capitalize", className)}
      >
        <FontAwesomeIcon icon={faPercent} />
        {isPostPrePrediction(post) ? t("prePredict") : t("predict")}
      </Button>

      {!isDesktop ? (
        <BottomDrawer
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) setIsOpen(false);
          }}
          title={post.question?.title ?? ""}
          titleClassName="text-lg font-semibold leading-6"
        >
          <div className="pt-3">
            <ForecastMaker
              post={post}
              onPredictionSubmit={() => setIsOpen(false)}
            />
          </div>
        </BottomDrawer>
      ) : (
        <BaseModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          label={post.question?.title ?? ""}
          className="max-h-[calc(100vh-200px)] w-full max-w-2xl"
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
