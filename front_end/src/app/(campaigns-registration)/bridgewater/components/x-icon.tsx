import { FC } from "react";

export const XIcon: FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="none">
        <g opacity="0.5">
          <line
            x1="0.853553"
            y1="0.646447"
            x2="16.8535"
            y2="16.6464"
            stroke="#777777"
          />
          <line
            y1="-0.5"
            x2="22.6273"
            y2="-0.5"
            transform="matrix(0.707107 -0.707107 -0.707107 -0.707107 0.500122 16.9999)"
            stroke="#777777"
          />
        </g>
      </svg>
    </div>
  );
};
