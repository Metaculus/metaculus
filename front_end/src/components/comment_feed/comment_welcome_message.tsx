import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { safeLocalStorage } from "@/utils/core/storage";

type Props = {
  onClick: () => void;
};

const STORAGE_KEY = "welcome_message_closed";

const CommentWelcomeMessage: FC<Props> = ({ onClick }) => {
  const t = useTranslations();
  return (
    <div className="rounded border border-orange-500 bg-orange-100 p-6 text-sm font-normal leading-5 text-gray-800 dark:border-orange-500-dark dark:bg-orange-100-dark dark:text-gray-800-dark">
      <h4 className="m-0 text-lg font-bold leading-7 text-orange-900 dark:text-orange-900-dark">
        {t("welcomeToMetaculusCommunity")}
      </h4>
      <p className="m-0 mt-4">
        {t.rich("reviewCommunityGuidelines", {
          link: (chunks) => (
            <Link
              href="/help/guidelines/"
              className="text-blue-700 dark:text-blue-700-dark"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
      <p className="m-0 mt-3">{t("keepCivilStayOnTopic")}</p>
      {!getIsMessagePreviouslyClosed() && (
        <Button
          className="mt-4"
          onClick={() => {
            safeLocalStorage.setItem(STORAGE_KEY, "true");
            onClick();
          }}
        >
          {t("understand")}
        </Button>
      )}
    </div>
  );
};

export function getIsMessagePreviouslyClosed(): boolean {
  const alreadyClosed = safeLocalStorage.getItem(STORAGE_KEY);

  return Boolean(alreadyClosed);
}

export default CommentWelcomeMessage;
