"use client";

import { faArrowsLeftRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnchorHTMLAttributes, ButtonHTMLAttributes, FC } from "react";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/cn";

export const BWRegisterButton: FC<
  ButtonHTMLAttributes<HTMLButtonElement> &
    AnchorHTMLAttributes<HTMLAnchorElement>
> = ({ children, ...props }) => {
  return (
    <Button
      variant="secondary"
      className="cursor-pointer text-nowrap px-2 py-0.5 text-xs xs:px-3 xs:py-2"
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
    "w-full cursor-pointer text-xs px-2 py-0.5 text-nowrap xs:px-3 xs:py-2";
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
      <h1 className="m-0 text-balance text-center text-base font-bold leading-snug text-blue-600 dark:text-blue-600-dark xs:text-xl sm:text-2xl md:leading-snug lg:text-left lg:text-4xl lg:leading-snug xl:text-4xl min-[1920px]:leading-normal">
        <span className="text-nowrap text-blue-800 dark:text-blue-800-dark">
          Bridgewater <span className="font-thin opacity-50">x</span> Metaculus
        </span>{" "}
        <br />
        Forecasting Contest <br />
        <p className="text-xs font-light text-blue-800 dark:text-blue-800-dark sm:text-sm lg:text-base">
          <span className="font-semibold">
            Now open to participants worldwide:
          </span>{" "}
          Register to forecast, explore opportunities with Bridgewater
          Associates, and compete for $25,000 in prizes!
        </p>
      </h1>
    </div>
  );
};

export const Dates: FC = () => {
  const dayClassName = "text-lg sm:text-4xl xl:text-7xl font-medium";
  const monthClassName = "text-xs xs:text-base xl:text-2xl opacity-60 ";
  const dateCardClassName =
    "z-10 flex size-full select-none flex-col items-center justify-center gap-1 rounded bg-blue-500/50 py-2 xs:py-4 xl:py-16 text-blue-800 transition-all hover:cursor-default hover:bg-blue-500 active:bg-blue-900 active:text-white dark:bg-blue-500-dark/50 dark:text-blue-100 dark:text-blue-800-dark dark:hover:bg-blue-500-dark dark:active:bg-blue-100 dark:active:text-blue-900 md:gap-2  lg:gap-3";
  return (
    <div className="relative flex size-full flex-row items-center justify-center gap-2">
      <div
        className={cn(
          dateCardClassName,
          "rounded-r-[16px] md:rounded-r-[24px] xl:rounded-r-[44px]"
        )}
      >
        <div className={monthClassName}>FEB</div>
        <div className={dayClassName}>3</div>
      </div>
      <div
        className={cn(
          dateCardClassName,
          "rounded-l-[16px] md:rounded-l-[24px] xl:rounded-l-[44px]"
        )}
      >
        <div className={monthClassName}>MAR</div>
        <div className={dayClassName}>31</div>
      </div>
      <span className=" absolute left-1/2 z-[11] ml-[-14px] flex size-[28px] rounded-full bg-blue-300 dark:bg-blue-100-dark md:ml-[-16px] md:size-[32px] xl:ml-[-22px] xl:size-[44px]">
        <FontAwesomeIcon
          icon={faArrowsLeftRight}
          size="xl"
          className="mx-auto self-center text-blue-600 dark:text-blue-600-dark/75"
        />
      </span>
    </div>
  );
};

export const Prize: FC = () => {
  return (
    <div className="flex size-full flex-row items-center justify-center ">
      <div className="dark relative z-20 flex size-full select-none flex-col items-center justify-center gap-1 rounded border-olive-700 bg-olive-500 py-2 font-medium text-olive-900 dark:text-olive-900-dark xs:py-4 md:gap-2 lg:gap-3 xl:py-16">
        <div className="text-xs opacity-60 xs:text-base xl:text-2xl ">
          PRIZE POOL
        </div>
        <div className="text-lg sm:text-4xl xl:text-7xl">$25k</div>
      </div>
    </div>
  );
};
