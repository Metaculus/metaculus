import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";

type Props = {
  commentCount: number;
  onClick: () => void;
};

const CommentWelcomeMessage: FC<Props> = ({ commentCount, onClick }) => {
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
      <Button className="mt-4" onClick={onClick}>
        {t(commentCount > 0 ? "understand" : "closeThisMessage")}
      </Button>
    </div>
  );
};

export default CommentWelcomeMessage;
