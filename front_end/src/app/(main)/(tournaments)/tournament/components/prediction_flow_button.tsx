"use client";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Tournament } from "@/types/projects";
import { getProjectSlug } from "@/utils/navigation";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";

type Props = {
  tournament: Tournament;
};

const PredictionFlowButton: React.FC<Props> = ({ tournament }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  return (
    <Button
      onClick={() => {
        if (isNil(user)) {
          setCurrentModal({ type: "signin" });
        }
      }}
      href={
        !isNil(user)
          ? `/tournament/${getProjectSlug(tournament)}/prediction-flow`
          : undefined
      }
      className="w-full flex-1 border-blue-400 text-sm text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark md:text-lg"
    >
      {t("predictionFlow")}
    </Button>
  );
};

export default PredictionFlowButton;
