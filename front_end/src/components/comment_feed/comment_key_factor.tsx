"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";

type Props = {
  keyFactor: KeyFactor;
};

const CommentKeyFactor: FC<Props> = ({ keyFactor: { text } }) => {
  const t = useTranslations();

  return (
    <div className="left-5 top-5 order-none my-2 box-border flex flex-col gap-1.5 rounded border border-blue-500 bg-blue-300 p-3 text-xs dark:border-blue-500-dark dark:bg-blue-300-dark md:flex-row md:gap-3">
      <div className="text-nowrap uppercase text-gray-500 dark:text-gray-600-dark">
        {t("keyFactor")}
      </div>
      <div className="order-1 grow-0 text-blue-800 dark:text-blue-800-dark">
        {text}
      </div>
    </div>
  );
};

export default CommentKeyFactor;
