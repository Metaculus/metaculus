"use client";

import React, { FC, PropsWithChildren } from "react";
import { useModal } from "@/contexts/modal_context";
import { usePathname, useRouter } from "next/navigation";

import clsx from "clsx";
import Button from "@/components/ui/button";

const Card: FC<PropsWithChildren<{ className?: string }>> = ({
  children,
  className,
}) => {
  return (
    <div
      className={clsx(
        "text-md w-[256px] max-w-full bg-gray-0 p-6  dark:bg-gray-0-dark ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const ChoicesCards = () => {
  const { setCurrentModal } = useModal();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4 text-gray-900 dark:text-gray-900-dark sm:flex-row">
      <div
        className="cursor-pointer"
        onClick={() => setCurrentModal({ type: "signin" })}
      >
        <Card>I already have a Metaculus account</Card>
      </div>

      <div
        className="cursor-pointer"
        onClick={() => {
          router.push(`${pathname}/signup-and-register`);
        }}
      >
        <Card>I don't have a Metaculus account</Card>
      </div>
    </div>
  );
};

export const SuccessCard = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Card className="w-[415px]">
        <div className="flex flex-col items-center gap-7">
          <p className="text-base text-gray-900 dark:text-gray-900-dark">
            You have successfully registered!
          </p>
          <Button
            variant="tertiary"
            onClick={() => {
              router.push(`/questions`);
            }}
            className=""
          >
            Start practicing
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const AlreadyRegisteredCard = () => {
  const router = useRouter();

  return (
    <div className="flex max-h-48 flex-col gap-4 sm:flex-row">
      <Card className="w-[415px]">
        <div className="flex flex-col items-center gap-7">
          <p className="text-base text-gray-900 dark:text-gray-900-dark">
            You are already registered.
          </p>
          <Button
            variant="tertiary"
            onClick={() => {
              router.push(`/questions`);
            }}
            className=""
          >
            Start practicing
          </Button>
        </div>
      </Card>
    </div>
  );
};
