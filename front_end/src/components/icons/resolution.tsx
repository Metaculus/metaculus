import * as React from "react";
import { SVGProps } from "react";

const ResolutionIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeWidth={1.5}
      d="M8 3.81 12.19 8 8 12.19 3.81 8z"
    />
  </svg>
);
export default ResolutionIcon;
