import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

export type FocusAreaItem = {
  id: string;
  title: string;
  Icon: FC;
  text: string;
  href: string;
};

const FocusAreaLink: FC<FocusAreaItem> = ({ title, text, Icon, href, id }) => {
  const t = useTranslations();

  return (
    <Link
      href={href}
      className={classNames(
        "flex flex-1 flex-col rounded-b-2xl border-t-[1rem] bg-gray-0 p-6 no-underline hover:shadow-lg active:shadow-md dark:bg-gray-0-dark",
        {
          "border-t-[#47ac9ab2] dark:border-t-[#51b3a6]": id === "bio",
          "border-t-[#6b1f5380] dark:border-t-[#d0a0c1]": id === "ai",
          "border-t-[#eec18c] dark:border-t-[#ffd099]": id === "nuc",
          "border-t-[#7fb5c6] dark:border-t-[#98d7eb]": id === "cli",
        }
      )}
    >
      <div
        className={classNames(
          "text-black my-2 flex size-16 items-center justify-center rounded-full",
          {
            "bg-[#47ac9a80] dark:bg-[#51b3a6]": id === "bio",
            "bg-[#6b1f534d] dark:bg-[#d0a0c1]": id === "ai",
            "bg-[#eec18c80] dark:bg-[#ffd099]": id === "nuc",
            "bg-[#7fb5c680] dark:bg-[#98d7eb]": id === "cli",
          }
        )}
      >
        <Icon />
      </div>
      <h3 className="text-2xl text-gray-900 dark:text-gray-900-dark">
        {title}
      </h3>
      <p className="m-0 mb-9 flex-1 text-base text-gray-700 dark:text-gray-700-dark">
        {text}
      </p>
      <span className="inline-flex items-center text-base font-bold text-blue-800 no-underline dark:text-blue-800-dark">
        {t("seeForecasts")}
        <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 mr-1" />
      </span>
    </Link>
  );
};

export default FocusAreaLink;
