import { FC, SVGProps } from "react";

const DisabledArrow: FC<SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      viewBox="0 0 70 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      width="100%"
      height={13}
      {...props}
    >
      <path
        strokeDasharray="4 2"
        strokeWidth={2}
        d="M0 6.5h70"
        className="stroke-blue-500 dark:stroke-blue-500-dark"
      />
    </svg>
  );
};

export default DisabledArrow;
