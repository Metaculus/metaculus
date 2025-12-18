"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import toast from "react-hot-toast";

import {
  getBotTokenAction,
  impersonateBotAction,
} from "@/app/(main)/accounts/settings/actions";
import Button from "@/components/ui/button";
import { CurrentBot } from "@/types/users";
import { extractError } from "@/utils/core/errors";

import BotUpdateButton from "./update_button";

type Props = {
  bot: CurrentBot;
};

const BotControls: FC<Props> = ({ bot }) => {
  const t = useTranslations();
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { id } = bot;

  const handleRevealKey = async () => {
    // If token is already shown, hide it
    if (apiToken) {
      setApiToken(null);
      return;
    }

    setIsLoading(true);
    const response = await getBotTokenAction(id);
    setIsLoading(false);

    if (response.token) {
      setApiToken(response.token);
    } else if (response.errors) {
      toast.error(extractError(response.errors));
    }
  };

  const [isImpersonating, setIsImpersonating] = useState(false);

  const handleImpersonate = async () => {
    setIsImpersonating(true);
    const response = await impersonateBotAction(id);

    if (response?.errors) {
      setIsImpersonating(false);
      toast.error(extractError(response.errors));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <BotUpdateButton bot={bot} />
        <Button size="xs" href={`/accounts/profile/${id}/`}>
          {t("viewProfile")}
        </Button>
        <Button size="xs" onClick={handleRevealKey} disabled={isLoading}>
          {apiToken ? t("hideApiKey") : t("revealApiKey")}
          {isLoading && (
            <FontAwesomeIcon icon={faSpinner} spin className="ml-1" />
          )}
        </Button>
        <Button
          size="xs"
          onClick={handleImpersonate}
          disabled={isImpersonating}
        >
          {t("switchToBotAccount")}
          {isImpersonating && (
            <FontAwesomeIcon icon={faSpinner} spin className="ml-1" />
          )}
        </Button>
      </div>

      {apiToken && (
        <div className="flex items-center text-sm">
          <div className="w-full break-all pr-10 text-gray-600 dark:text-gray-600-dark">
            <div className="font-bold">{t("accessToken")}</div>
            {apiToken}
          </div>
          <Button
            aria-label={t("copyApiToken")}
            variant="link"
            size="sm"
            onClick={() =>
              navigator.clipboard
                .writeText(apiToken)
                .then(() => toast(t("copiedApiTokenMessage")))
            }
            className="font-normal text-blue-700 dark:text-blue-700-dark"
          >
            ({t("copy")})
          </Button>
        </div>
      )}
    </div>
  );
};

export default BotControls;
