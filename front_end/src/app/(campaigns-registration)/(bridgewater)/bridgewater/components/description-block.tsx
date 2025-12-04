import { FC } from "react";

import { BRIDGEWATER_2026 } from "../constants";

/**
 * Description block showing the main tournament description
 * Modeled after tournament page description structure
 */
const DescriptionBlock: FC = () => {
  return (
    <div className="rounded-md bg-gray-0 p-6 dark:bg-gray-0-dark sm:p-8 lg:mx-0">
      <div className="prose prose-blue dark:prose-invert max-w-none">
        {BRIDGEWATER_2026.description.split("\n\n").map((paragraph, index) => (
          <p
            key={index}
            className="text-base leading-relaxed text-gray-700 dark:text-gray-300"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DescriptionBlock;
