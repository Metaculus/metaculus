import { useTranslations } from "next-intl";
import { FC, KeyboardEvent } from "react";

import { useQuestionLayoutSafe } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
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
  const questionLayout = useQuestionLayoutSafe();

  const handleActivate = () => {
    questionLayout?.setMobileActiveTab("comments");

    const target = document.getElementById(linkAnchor.replace("#", ""));
    if (target) {
      scrollTo(target.getBoundingClientRect().top);
    }
    sendAnalyticsEvent("KeyFactorClick", { event_label: "fromList" });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div className="flex w-full justify-between">
      <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {label}
      </div>

      <div className="text-[10px] text-gray-600 dark:text-gray-600-dark">
        {t.rich("byUsername", {
          link: (chunk) => (
            <div
              className="inline-block cursor-pointer bg-transparent p-0 text-[10px] font-normal text-blue-700 no-underline underline-offset-2 hover:underline focus:underline focus:outline-none dark:text-blue-700-dark"
              onClick={handleActivate}
              onKeyDown={handleKeyDown}
              role="link"
            >
              {chunk}
            </div>
          ),
          username: `@${username}`,
        })}
      </div>
    </div>
  );
};

export default KeyFactorHeader;
