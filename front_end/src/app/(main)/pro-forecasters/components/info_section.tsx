import classNames from "classnames";
import { FC, ReactNode } from "react";

type Props = {
  title: string;
  info: string | ReactNode;
  size?: "md" | "lg";
};

const ProForecastersInfoSection: FC<Props> = ({ title, info, size = "md" }) => {
  return (
    <>
      <h2
        className={classNames("m-0 font-bold", {
          "text-2xl": size === "lg",
          "text-xl": size === "md",
        })}
      >
        {title}
      </h2>
      <p className="m-0">{info}</p>
    </>
  );
};

export default ProForecastersInfoSection;
