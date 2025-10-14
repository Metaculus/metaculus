"use client";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import cn from "@/utils/core/cn";

import KeyFactorStrengthVoter from "./key_factor_strength_voter";
import KeyFactorText from "./key_factor_text";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  linkAnchor: string;
  variant?: "default" | "compact";
};

const KeyFactorDriver: FC<Props> = ({
  keyFactor,
  linkToComment = true,
  linkAnchor,
  variant = "default",
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark [&:hover_.target]:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      <KeyFactorText
        text={keyFactor.driver.text}
        linkAnchor={variant === "compact" ? undefined : linkAnchor}
        linkToComment={linkToComment}
        className="text-base leading-5"
      />

      <KeyFactorStrengthVoter keyFactorId={keyFactor.id} vote={keyFactor.vote} />
    </div>
  );
};

export default KeyFactorDriver;
