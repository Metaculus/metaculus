import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Tooltip from "@/components/ui/tooltip";

// Renders the "(95% CI ⓘ)" suffix appended to a column header
const ConfidenceIntervalTooltip: FC = () => {
  const t = useTranslations();
  return (
    <span className="ml-1 inline-flex items-center text-xs">
      (<span className="mr-1">{t("confidenceInterval95")}</span>
      <span className="relative w-3 text-blue-700 dark:text-blue-700-dark">
        <Tooltip
          showDelayMs={200}
          placement={"right"}
          tooltipContent={
            <div className="text-sm font-normal">
              <p className="m-0">
                {t.rich("confidenceIntervalTooltip", {
                  link: (chunks) => (
                    <a
                      href="https://en.wikipedia.org/wiki/Bootstrapping_(statistics)"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 dark:text-blue-700-dark"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </p>
              <Link
                href="/help/scores-faq/#tournaments-section"
                className="mt-2 inline-block text-blue-700 dark:text-blue-700-dark"
              >
                {t("learnMoreFAQ")}
              </Link>
            </div>
          }
          className="absolute left-0 top-1/2 inline-flex -translate-y-1/2 items-center justify-center font-sans text-xs leading-none"
          variant="light"
          tooltipClassName="font-sans text-center"
        >
          <span className="leading-none">ⓘ</span>
        </Tooltip>
      </span>
      )
    </span>
  );
};

export default ConfidenceIntervalTooltip;
