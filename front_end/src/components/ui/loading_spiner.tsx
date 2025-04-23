import { SizeProp } from "@fortawesome/fontawesome-svg-core";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
  size?: SizeProp;
};

const LoadingSpinner: FC<Props> = ({ className, size = "2x" }) => {
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <FontAwesomeIcon
        icon={faSpinner}
        size={size}
        className="w-full animate-spin"
      />
    </span>
  );
};

export default LoadingSpinner;
