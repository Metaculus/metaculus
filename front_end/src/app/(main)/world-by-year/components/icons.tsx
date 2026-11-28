import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

import { WorldArea } from "../data/questions";

type IconProps = { className?: string };

const StrokeIcon: FC<IconProps & { children: ReactNode }> = ({
  className,
  children,
}) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden
    className={cn(
      "shrink-0 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]",
      className
    )}
  >
    {children}
  </svg>
);

const AREA_ICON_PATHS: Record<WorldArea, ReactNode> = {
  sci: (
    <path d="M9 3h6M10 3v6.2L4.8 18.4A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3M7.6 15h8.8" />
  ),
  prog: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />,
  work: (
    <path d="M3.5 8.5h17V19h-17zM9 8.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.5M3.5 13h17" />
  ),
  robo: (
    <>
      <path d="M12 3v3M6 6h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 18 18H6a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 6 6zM2.5 11v3M21.5 11v3M9.5 14.5h5" />
      <circle cx="9" cy="10.5" r=".9" />
      <circle cx="15" cy="10.5" r=".9" />
    </>
  ),
  media: <path d="M3.5 5.5h17v13h-17zM10 9.2v5.6l5-2.8z" />,
};

export const AreaIcon: FC<IconProps & { area: WorldArea }> = ({
  area,
  className,
}) => (
  <StrokeIcon className={cn("stroke-[1.6]", className)}>
    {AREA_ICON_PATHS[area]}
  </StrokeIcon>
);

export const ArrowIcon: FC<IconProps & { direction: "left" | "right" }> = ({
  direction,
  className,
}) => (
  <StrokeIcon className={cn("stroke-[2.4]", className)}>
    <path
      d={
        direction === "left"
          ? "M14.5 5.5L8 12l6.5 6.5"
          : "M9.5 5.5L16 12l-6.5 6.5"
      }
    />
  </StrokeIcon>
);

export const CaretIcon: FC<IconProps & { direction: "left" | "right" }> = ({
  direction,
  className,
}) => (
  <svg
    viewBox="0 0 256 256"
    aria-hidden
    className={cn("fill-current", className)}
  >
    <path
      d={
        direction === "left"
          ? "M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"
          : "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"
      }
    />
  </svg>
);

export const LongArrowIcon: FC<IconProps & { direction: "left" | "right" }> = ({
  direction,
  className,
}) => (
  <svg
    viewBox="0 0 256 256"
    aria-hidden
    className={cn("fill-current", className)}
  >
    <path
      d={
        direction === "left"
          ? "M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"
          : "M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"
      }
    />
  </svg>
);

export const OpenIcon: FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 256 256"
    aria-hidden
    className={cn("fill-current", className)}
  >
    <path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z" />
  </svg>
);

export const CloseIcon: FC<IconProps> = ({ className }) => (
  <svg
    viewBox="0 0 256 256"
    aria-hidden
    className={cn("fill-current", className)}
  >
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
  </svg>
);

export const PlayPauseIcon: FC<IconProps & { playing: boolean }> = ({
  playing,
  className,
}) => {
  const pathClassName =
    "origin-center transition-[opacity,transform] duration-[120ms] [transform-box:fill-box]";
  return (
    <svg
      viewBox="0 0 256 256"
      aria-hidden
      className={cn("shrink-0 overflow-visible fill-current", className)}
    >
      <path
        className={cn(pathClassName, playing && "scale-[.6] opacity-0")}
        d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z"
      />
      <path
        className={cn(pathClassName, !playing && "scale-[.6] opacity-0")}
        d="M216,48V208a16,16,0,0,1-16,16H160a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h40A16,16,0,0,1,216,48ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Z"
      />
    </svg>
  );
};
