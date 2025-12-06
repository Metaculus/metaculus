import { FC } from "react";

import { BRIDGEWATER_2026 } from "../constants";

/**
 * Description block showing the main tournament description
 * Modeled after tournament page description structure
 */
const DescriptionBlock: FC = () => {
  return (
    <div className="rounded-md bg-gray-0 px-6 py-2 dark:bg-gray-0-dark sm:px-8 sm:py-4 lg:mx-0">
      <div className="prose prose-blue dark:prose-invert max-w-none">
        {BRIDGEWATER_2026.description.split("\n\n").map((paragraph, index) => (
          <p
            key={index}
            className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DescriptionBlock;
