import { FC, SVGProps } from "react";

import cn from "@/utils/core/cn";

type Props = SVGProps<SVGSVGElement> & {
  didHappen?: boolean;
};

const Arrow: FC<Props> = ({ didHappen, ...props }) => {
  return (
    <svg
      viewBox="0 0 64 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      width="100%"
      height={6}
      {...props}
    >
      <path
        d="M64 3 59 .113v5.774L64 3ZM0 3.5h59.5v-1H0v1Z"
        className={cn("fill-blue-700 dark:fill-blue-700", {
          "fill-blue-900 dark:fill-blue-900-dark": didHappen,
        })}
      />
    </svg>
  );
};

export default Arrow;
