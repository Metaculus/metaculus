import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, ReactNode } from "react";

interface DisclosureItemProps {
  question: string;
  description: ReactNode;
}

const DisclosureItem: React.FC<DisclosureItemProps> = ({
  question,
  description,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex w-full items-center gap-3 rounded p-3 text-lg transition-all ${
          isOpen
            ? "bg-blue-500 dark:bg-blue-600"
            : "bg-white dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
        }`}
      >
        <FontAwesomeIcon
          icon={faChevronDown}
          size="sm"
          className={`text-blue-700 transition-transform ${
            isOpen
              ? "rotate-180 text-blue-800 dark:text-blue-400"
              : "dark:text-blue-500"
          }`}
        />
        {question}
      </button>
      {isOpen && <div className="p-3 pb-0 text-gray-700">{description}</div>}
    </div>
  );
};

export default DisclosureItem;
