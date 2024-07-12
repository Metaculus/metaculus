import { FC, SVGProps } from "react";

const BronzeMedal: FC<SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g id="Group 857">
        <circle
          id="Ellipse 69"
          cx="10"
          cy="10"
          r="9.59016"
          fill="#F09B59"
          stroke="#C96418"
          strokeWidth="0.819672"
        />
        <g id="Ellipse 70" opacity="0.5" filter="url(#filter0_d_484_6601)">
          <path
            d="M13.5354 6.46458C11.5828 4.51195 8.41695 4.51196 6.46433 6.46458L13.5354 13.5356C15.488 11.583 15.488 8.4172 13.5354 6.46458Z"
            fill="#C96418"
          />
        </g>
        <g id="Ellipse 68" opacity="0.7" filter="url(#filter1_d_484_6601)">
          <path
            d="M6.4646 13.5354C8.41722 15.488 11.583 15.488 13.5357 13.5354L6.4646 6.46436C4.51198 8.41698 4.51198 11.5828 6.4646 13.5354Z"
            fill="#C96418"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_484_6601"
          x="3.46436"
          y="1.5"
          width="14.5355"
          height="14.5356"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-0.5" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_484_6601"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_484_6601"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_d_484_6601"
          x="2.00012"
          y="2.96436"
          width="14.5355"
          height="14.5356"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="-0.5" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_484_6601"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_484_6601"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
};

export default BronzeMedal;
