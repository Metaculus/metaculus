import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  title: string;
  titleIcon?: ReactNode;
  info: string | ReactNode;
  size?: "md" | "lg";
};

const ProForecastersInfoSection: FC<Props> = ({
  title,
  info,
  size = "md",
  titleIcon = null,
}) => {
  return (
    <>
      <div className="flex gap-3">
        {titleIcon}
        <h2
          className={cn("m-0 font-bold", {
            "text-2xl": size === "lg",
            "text-xl": size === "md",
          })}
        >
          {title}
        </h2>
      </div>
      <p className="m-0">{info}</p>
    </>
  );
};

export default ProForecastersInfoSection;
