// back_to_create.tsx

import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React from "react";

interface BacktoCreateProps {
  backText: string;
  backHref: string;
  currentPage: string;
}

const BacktoCreate: React.FC<BacktoCreateProps> = ({
  backText,
  backHref,
  currentPage,
}) => {
  return (
    <div className="mx-0 my-4 flex flex-row items-center gap-3 text-xl text-gray-700 dark:text-gray-700-dark xs:text-2xl md:text-3xl">
      <Link
        href={backHref}
        className="font-medium capitalize text-blue-700 no-underline hover:text-blue-800 dark:text-blue-700-dark hover:dark:text-blue-800-dark"
      >
        {backText}
      </Link>
      <FontAwesomeIcon
        size="sm"
        icon={faChevronRight}
        className="text-blue-600 dark:text-blue-600-dark"
      />
      <span className="font-light capitalize">{currentPage}</span>
    </div>
  );
};

export default BacktoCreate;
