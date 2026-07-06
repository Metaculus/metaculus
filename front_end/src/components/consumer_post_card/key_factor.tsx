import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { KeyFactor } from "@/types/comment";
import cn from "@/utils/core/cn";
import { isDriverKF } from "@/utils/key_factors";

type Props = {
  keyFactor: KeyFactor[];
  className?: string;
};

const ConsumerKeyFactor: FC<Props> = ({ keyFactor, className }) => {
  const t = useTranslations();
  // TODO: Adjust to render only the top key factor with min amount of upvotes
  const driverKF = useMemo(() => keyFactor.find(isDriverKF), [keyFactor]);
  if (!driverKF || !driverKF.driver) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded bg-mint-200 p-3 dark:bg-mint-200-dark",
        className
      )}
    >
      <h4 className="m-0 text-sm font-bold uppercase leading-4 text-mint-900 text-opacity-55 dark:text-mint-900-dark">
        {t("keyFactor")}
      </h4>
      <p className="m-0 text-sm font-medium leading-5 text-gray-800 dark:text-gray-800-dark">
        {driverKF.driver.text}
      </p>
    </div>
  );
};

export default ConsumerKeyFactor;
