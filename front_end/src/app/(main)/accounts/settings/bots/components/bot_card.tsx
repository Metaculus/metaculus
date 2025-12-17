import { useTranslations } from "next-intl";
import { FC } from "react";

import BotControls from "@/app/(main)/accounts/settings/bots/components/bot_controls";
import { CurrentBot } from "@/types/users";
import cn from "@/utils/core/cn";
import { formatUsername } from "@/utils/formatters/users";

type Props = {
  bot: CurrentBot;
};

const BotCard: FC<Props> = ({ bot }) => {
  const t = useTranslations();
  const { is_primary_bot } = bot;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded border border-blue-400 bg-gray-0 p-5 dark:border-blue-400-dark dark:bg-gray-0-dark",
        {
          "outline outline-4 outline-orange-400 dark:outline-orange-400-dark":
            is_primary_bot,
        }
      )}
    >
      {is_primary_bot && (
        <div className="text-xs text-orange-800 dark:text-orange-800-dark">
          {t("primaryBotEligibleDisclaimer")}
        </div>
      )}
      <div className="font-medium text-blue-800 dark:text-blue-800-dark">
        {formatUsername(bot)}
      </div>
      <BotControls bot={bot} />
    </div>
  );
};

export default BotCard;
