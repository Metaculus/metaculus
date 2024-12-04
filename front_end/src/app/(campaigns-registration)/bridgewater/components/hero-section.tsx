"use client";

import { FC, PropsWithChildren } from "react";
import clsx from "clsx";
import Image from "next/image";
import { XIcon } from "./x-icon";
import { useModal } from "@/contexts/modal_context";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/button";

export const ChoicesButtons = () => {
  const { setCurrentModal } = useModal();
  const pathname = usePathname();

  return (
    <>
      <div className="flex w-full flex-col items-start gap-4 pb-8 text-gray-900 dark:text-gray-900-dark sm:items-center sm:pb-10 md:flex-row md:justify-center md:gap-6 ">
        <Button
          variant="secondary"
          className="cursor-pointer"
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          I already have a Metaculus account
        </Button>

        <Button
          variant="secondary"
          className="cursor-pointer"
          href={`${pathname}/signup-and-register`}
        >
          I don't have a Metaculus account
        </Button>
      </div>
    </>
  );
};

export const ContestHeader: FC = () => {
  return (
    <div className="flex h-full w-full max-w-[629px] flex-col items-start px-5 sm:items-center sm:px-8">
      <div className="mt-10 flex text-2xl font-semibold text-blue-800 dark:text-blue-800-dark sm:text-4xl ">
        <span className="">Bridgewater</span>
        <div className="m-3 flex items-center">
          <XIcon className="size-4" />
        </div>
        <span className="">Metaculus</span>
      </div>

      <div className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-600-dark  sm:text-4xl">
        Forecasting Contest
      </div>

      <p className="mt-5 text-base text-blue-800 dark:text-blue-800-dark opacity-70 sm:text-center sm:text-xl">
        Register to forecast, explore opportunities with Bridgewater Associates,
        and compete for <span className="font-bold">$25,000 in prizes!</span>
      </p>
    </div>
  );
};

export const HeroSection: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col items-center rounded-md bg-gray-0 dark:bg-gray-0-dark",
        className
      )}
    >
      <Image
        className="w-full rounded-t-md"
        src="https://metaculus-public.s3.us-west-2.amazonaws.com/BridgeWaterCover.png"
        width={1560}
        height={264}
        alt={"Cover image"}
      />
      <ContestHeader />
      {children}
    </div>
  );
};
