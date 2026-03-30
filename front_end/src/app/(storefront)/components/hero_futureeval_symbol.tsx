import { FC } from "react";

const HeroFutureEvalSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="30"
    height="35"
    viewBox="0 0 30 35"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path d="M23 11H4V21H23V25H4V35H0V7H23V11Z" fill="white" />
    <rect
      x="7"
      y="18"
      width="4"
      height="23"
      transform="rotate(-90 7 18)"
      fill="white"
      opacity="0.5"
    />
    <rect
      x="7"
      y="4"
      width="4"
      height="23"
      transform="rotate(-90 7 4)"
      fill="white"
      opacity="0.5"
    />
    <rect
      x="7"
      y="32"
      width="4"
      height="23"
      transform="rotate(-90 7 32)"
      fill="white"
      opacity="0.5"
    />
  </svg>
);

export default HeroFutureEvalSymbol;
