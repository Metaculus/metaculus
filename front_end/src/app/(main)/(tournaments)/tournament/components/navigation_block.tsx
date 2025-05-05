"use client";

import { isNil } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Tournament } from "@/types/projects";

type Props = {
  tournament: Tournament;
};

const NavigationBlock: FC<Props> = ({ tournament }) => {
  const router = useRouter();
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  return (
    <div className="mx-4 mt-4 flex flex-row justify-between gap-2 lg:mx-0">
      {tournament.forecasts_flow_enabled && (
        <Button
          onClick={() => {
            if (isNil(user)) {
              setCurrentModal({ type: "signin" });
            }
            router.push(`/tournament/${tournament.slug}/prediction-flow`);
          }}
          className="w-full flex-1 border-blue-400 text-sm text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark md:text-lg"
        >
          {t("forecastFlow")}
        </Button>
      )}

      <Button
        href={"#questions"}
        className="w-full flex-1 gap-1 border-blue-400 text-sm text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark md:text-lg"
      >
        {t.rich("viewQuestions", {
          count: tournament.questions_count,
          bold: (chunks) => <span className="font-bold">{chunks}</span>,
        })}
      </Button>
    </div>
  );
};

export default NavigationBlock;
