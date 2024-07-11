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
    <div className="mb-2 mb-4 ml-0 mr-0 mt-4 flex flex-row items-center gap-3 text-gray-700 dark:text-gray-200">
      <Link
        href={backHref}
        className="text-2xl font-medium text-blue-500 no-underline hover:text-blue-600 max-[360px]:text-xl md:text-3xl"
      >
        {backText}
      </Link>
      <FontAwesomeIcon
        size="lg"
        icon={faChevronRight}
        className="text-blue-500 opacity-75 max-[360px]:text-sm"
      />
      <span className="text-2xl font-light max-[360px]:text-xl md:text-3xl">
        {currentPage}
      </span>
    </div>
  );
};

export default BacktoCreate;
