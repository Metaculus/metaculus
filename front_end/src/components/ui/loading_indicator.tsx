import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

const LoadingIndicator: FC<Props> = ({ className }) => {
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <FontAwesomeIcon
        icon={faEllipsis}
        size="2x"
        className="w-full animate-loading-slide"
      />
    </span>
  );
};

export default LoadingIndicator;
