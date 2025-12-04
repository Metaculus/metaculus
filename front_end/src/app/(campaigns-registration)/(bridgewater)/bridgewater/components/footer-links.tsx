import {
  faCircleQuestion,
  faClipboardList,
  faMugHot,
  IconDefinition,
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
  icon: IconDefinition;
  title: string;
  href: string;
}> = ({ icon, title, href }) => {
  return (
    <Link
      href={href}
      className="hover:bg-blue-50 group flex w-full items-center justify-between gap-3 rounded-md bg-white p-6 text-center no-underline transition-all dark:bg-gray-0-dark dark:hover:bg-blue-900"
    >
      <FontAwesomeIcon
        icon={icon}
        className="text-xl text-blue-500 transition-colors group-hover:text-blue-700 dark:text-blue-500-dark dark:group-hover:text-blue-400"
      />
      <span className="w-full text-center text-base font-medium text-blue-800 transition-colors group-hover:text-blue-900 dark:text-gray-200 dark:group-hover:text-blue-200">
        {title}
      </span>
    </Link>
  );
};

export default FooterLinks;
