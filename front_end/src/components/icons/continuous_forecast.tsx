import * as React from "react";
import { SVGProps } from "react";

const ContinuousForecastIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="18"
    viewBox="0 0 20 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      opacity="0.5"
      d="M19.9999 9L18.8296 7.61325C16.9296 5.36166 14.1333 4.0625 11.1872 4.0625H9.99988H8.64779C5.32491 4.0625 2.21907 5.71306 0.359774 8.46707L-1.90735e-05 9L0.350847 9.50655C2.21884 12.2034 5.29081 13.8125 8.57142 13.8125H9.99993H11.264C14.1659 13.8125 16.9247 12.5519 18.8241 10.358L19.9999 9Z"
      fill="#9FD19F"
    />
    <path
      d="M10.25 1L10.25 17C10.25 17.1381 10.1381 17.25 10 17.25C9.86193 17.25 9.75 17.1381 9.75 17L9.75 1C9.75 0.861929 9.86193 0.75 10 0.75C10.1381 0.75 10.25 0.861929 10.25 1Z"
      fill="#384F38"
      stroke="#384F38"
      stroke-width="0.5"
    />
  </svg>
);

export default ContinuousForecastIcon;
