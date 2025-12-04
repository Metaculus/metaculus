import {
  faCircleQuestion,
  faClipboardList,
  faMugHot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FC } from "react";

import { BRIDGEWATER_2026 } from "../constants";

/**
 * Footer links for additional resources
 */
const FooterLinks: FC = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:mx-0">
      <FooterLinkCard
        icon={faCircleQuestion}
        title="How it works"
        href={BRIDGEWATER_2026.howItWorksUrl}
      />
      <FooterLinkCard
        icon={faClipboardList}
        title="Contest Rules"
        href={BRIDGEWATER_2026.contestRulesUrl}
      />
      <FooterLinkCard
        icon={faMugHot}
        title="Practice Questions"
        href={BRIDGEWATER_2026.practiceQuestionsUrl}
      />
    </div>
  );
};

/**
 * Individual footer link card
 * Using last year's button style with nice hover states
 */
const FooterLinkCard: FC<{
  icon: any;
  title: string;
  href: string;
}> = ({ icon, title, href }) => {
  return (
    <Link
      href={href}
      className="hover:bg-blue-50 group flex items-center justify-center gap-3 rounded-md border-2 border-gray-300 bg-white p-6 text-center no-underline transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-600 dark:bg-gray-0-dark dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
    >
      <FontAwesomeIcon
        icon={icon}
        className="text-2xl text-gray-600 transition-colors group-hover:text-blue-700 dark:text-gray-400 dark:group-hover:text-blue-400"
      />
      <span className="text-base font-medium text-gray-800 transition-colors group-hover:text-blue-800 dark:text-gray-200 dark:group-hover:text-blue-200">
        {title}
      </span>
    </Link>
  );
};

export default FooterLinks;
