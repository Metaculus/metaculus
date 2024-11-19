import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import LocalDaytime from "../ui/local_daytime";

type Props = {
  cpRevealTime?: string;
  className?: string;
  textClassName?: string;
};

const CPRevealTime: FC<Props> = ({
  cpRevealTime,
  className,
  textClassName,
}) => {
  const t = useTranslations();
  if (!cpRevealTime) {
    return null;
  }

  return (
    <div
      className={classNames(
        "absolute inset-0 flex items-center justify-center text-center",
        className
      )}
    >
      <p
        className={classNames(
          "max-w-[300px] pl-5 max-[425px]:max-w-[200px] md:max-w-max md:pl-0",
          textClassName
        )}
      >
        {t("cpWillRevealOn")} <LocalDaytime date={cpRevealTime} />
      </p>
    </div>
  );
};

export default CPRevealTime;
