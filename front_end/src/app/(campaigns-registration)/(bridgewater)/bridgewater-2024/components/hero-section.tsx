"use client";

import { faArrowsLeftRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from "react";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

export const BWRegisterButton: FC<
  ButtonHTMLAttributes<HTMLButtonElement> &
    AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ children, ...props }) => {
  return (
    <Button
      variant="secondary"
      className="mt-0 scale-100 cursor-pointer text-nowrap xl:mt-5 xl:scale-125 min-[1920px]:scale-150"
      size="md"
      {...props}
    >
      {children}
    </Button>
  );
};

export const ChoicesButtons: FC<{
  className?: string;
  onSignupClicked: () => void;
}> = ({ className, onSignupClicked }) => {
  const { setCurrentModal } = useModal();

  const customButtonClassNames =
    "w-full cursor-pointer text-xs px-2 py-1 text-nowrap xs:px-3 xs:py-2 md:text-base md:px-4 md:py-2.5 xl:text-lg xl:px-5 xl:px-3.5";
  return (
    <>
      <div className={cn("text-gray-900 dark:text-gray-900-dark", className)}>
        <Button
          variant="secondary"
          className={customButtonClassNames}
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          I already have a Metaculus Account
        </Button>

        <Button
          variant="secondary"
          className={customButtonClassNames}
          onClick={onSignupClicked}
        >
          I’m new – Sign up and join the contest
        </Button>
      </div>
    </>
  );
};

export const Hero = () => {
  return (
    <div className="h-full w-full rounded bg-white p-4 dark:bg-blue-100-dark md:p-6 lg:gap-2 lg:p-8 min-[1920px]:gap-3 min-[1920px]:p-12">
      <h1 className="m-0 mt-4 text-balance text-center text-xl font-bold leading-snug text-blue-600 dark:text-blue-600-dark xs:text-2xl sm:text-3xl md:text-4xl lg:text-left lg:text-4xl lg:leading-normal xl:leading-normal min-[1920px]:text-5xl  min-[1920px]:leading-normal">
        <span className="text-nowrap text-blue-800 dark:text-blue-800-dark">
          Bridgewater <span className="font-thin opacity-50">x</span> Metaculus
        </span>{" "}
        <br />
        Forecasting Contest <br />
        <p className="text-sm font-light leading-normal text-blue-800 dark:text-blue-800-dark sm:text-sm md:text-lg lg:text-xl min-[1920px]:text-2xl min-[1920px]:leading-normal ">
          <span className="font-semibold">Registrations are now closed.</span>{" "}
          Thank you to all who joined to forecast and compete for $25,000 in
          prizes!
        </p>
      </h1>
    </div>
  );
};

export const Dates: FC = () => {
  const dayClassName =
    "text-2xl sm:text-4xl md:text-5xl xl:text-7xl min-[1920px]:text-9xl font-medium md:font-light";
  const monthClassName =
    "text-xs xs:text-base xl:text-3xl min-[1920px]:text-4xl opacity-60 ";
  const dateCardClassName =
    "z-10 flex size-full select-none flex-col items-center justify-center gap-1 rounded bg-blue-500/50 py-2 xs:py-4 xl:py-16 text-blue-800 transition-all hover:cursor-default hover:bg-blue-500 active:bg-blue-900 active:text-white dark:bg-blue-500-dark/50 dark:text-blue-100 dark:text-blue-800-dark dark:hover:bg-blue-500-dark dark:active:bg-blue-100 dark:active:text-blue-900 md:gap-2  lg:gap-3";
  return (
    <div className="relative flex size-full flex-row items-center justify-center gap-2">
      <div
        className={cn(
          dateCardClassName,
          "gap-1 rounded-r-[16px] md:gap-2 md:rounded-r-[24px] xl:rounded-r-[44px] min-[1920px]:gap-6"
        )}
      >
        <div className={monthClassName}>FEB</div>
        <div className={dayClassName}>3</div>
      </div>
      <div
        className={cn(
          dateCardClassName,
          "gap-1 rounded-l-[16px] md:gap-2 md:rounded-l-[24px] xl:rounded-l-[44px] min-[1920px]:gap-6"
        )}
      >
        <div className={monthClassName}>MAR</div>
        <div className={dayClassName}>31</div>
      </div>
      <span className=" absolute left-1/2 z-[11] ml-[-14px] flex size-[28px] rounded-full bg-blue-300 dark:bg-blue-100-dark md:ml-[-16px] md:size-[32px] xl:ml-[-22px] xl:size-[44px]">
        <FontAwesomeIcon
          icon={faArrowsLeftRight}
          size="xl"
          className="mx-auto scale-75 self-center text-blue-600 dark:text-blue-600-dark/75 md:scale-100"
        />
      </span>
    </div>
  );
};

export const Prize: FC = () => {
  return (
    <div className="flex size-full flex-row items-center justify-center ">
      <div className="dark relative z-20 flex size-full select-none flex-col items-center justify-center gap-1 rounded border-olive-700 bg-olive-500 py-2 font-medium text-olive-900 dark:text-olive-900-dark xs:py-4 md:gap-2 lg:gap-3 xl:py-16 min-[1920px]:gap-6">
        <div className="text-xs opacity-60 xs:text-base xl:text-3xl min-[1920px]:text-4xl">
          PRIZE POOL
        </div>
        <div className="text-2xl font-medium sm:text-4xl md:text-5xl md:font-light xl:text-7xl min-[1920px]:text-9xl">
          $25k
        </div>
      </div>
    </div>
  );
};
