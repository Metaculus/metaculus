"use client";
import classNames from "classnames";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";

type Props = {
  color: {
    DEFAULT: string;
    dark: string;
  };
  className?: string;
};

const ChoiceIcon: FC<Props> = ({ color, className }) => {
  const { getThemeColor } = useAppTheme();

  return (
    <div
      className={classNames("size-4 rounded-sm", className)}
      style={{ background: getThemeColor(color) }}
    />
  );
};

export default ChoiceIcon;
