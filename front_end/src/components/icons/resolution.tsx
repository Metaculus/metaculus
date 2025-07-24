import * as React from "react";
import { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  variant?: "normal" | "bold";
};

const ResolutionIcon = ({ variant, ...props }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={variant === "bold" ? 14 : 16}
    height={variant === "bold" ? 14 : 16}
    fill="none"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeWidth={variant === "bold" ? 2.5 : 1.5}
      d={
        variant === "bold"
          ? "M12.2324 7L7 12.2324L1.76758 7L7 1.76758L12.2324 7Z"
          : "M8 3.81 12.19 8 8 12.19 3.81 8z"
      }
    />
  </svg>
);
export default ResolutionIcon;
