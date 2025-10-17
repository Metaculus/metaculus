import { useTranslations } from "next-intl";
import { FC } from "react";

import useScrollTo from "@/hooks/use_scroll_to";
import { sendAnalyticsEvent } from "@/utils/analytics";

type Props = {
  label: string;
  username: string;
  linkAnchor: string;
  className?: string;
};

const KeyFactorHeader: FC<Props> = ({ label, username, linkAnchor }) => {
  const t = useTranslations();
  const scrollTo = useScrollTo();

  return (
    <div className="flex w-full justify-between">
      <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {label}
      </div>
      <div className="text-[10px] text-gray-600 dark:text-gray-600-dark">
        {t.rich("byUsername", {
          link: (chunk) => (
            <a
              className="text-[10px] font-normal text-blue-700 no-underline dark:text-blue-700-dark"
              href={linkAnchor}
              onClick={(e) => {
                const target = document.getElementById(
                  linkAnchor.replace("#", "")
                );
                if (target) {
                  e.preventDefault();
                  scrollTo(target.getBoundingClientRect().top);
                }
                sendAnalyticsEvent("KeyFactorClick", {
                  event_label: "fromList",
                });
              }}
            >
              {chunk}
            </a>
          ),
          username: `@${username}`,
        })}
      </div>
    </div>
  );
};

export default KeyFactorHeader;
