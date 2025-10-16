"use client";

import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

type Props = {
  icon: IconDefinition;
  title: string;
  description: string;
  href: string;
};

const AIBResourceCard: React.FC<Props> = ({
  icon,
  title,
  description,
  href,
}) => {
  return (
    <Link
      href={href}
      aria-label={`${title} — open`}
      className="group block flex-1 no-underline focus:outline-none"
    >
      <div
        className="flex h-full flex-1 flex-col items-start rounded-[10px] border border-gray-500 bg-gray-0 p-8 antialiased transition
                      hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-700
                      dark:border-gray-500-dark dark:bg-gray-0-dark"
      >
        <FontAwesomeIcon
          icon={icon}
          className="text-[26px] text-blue-700 transition-colors group-hover:text-blue-800 dark:text-blue-700-dark dark:group-hover:text-blue-600-dark"
          aria-hidden
        />
        <h4 className="m-0 mt-5 font-serif text-2xl font-semibold text-gray-800 dark:text-gray-800-dark">
          {title}
        </h4>
        <p className="m-0 mt-2.5 text-base text-gray-600 dark:text-gray-600-dark">
          {description}
        </p>
      </div>
    </Link>
  );
};

export default AIBResourceCard;
