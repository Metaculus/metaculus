"use client";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/cn";

type Props = {
  color: ThemeColor;
  className?: string;
};

const ChoiceIcon: FC<Props> = ({ color, className }) => {
  const { getThemeColor } = useAppTheme();

  return (
    <div
      className={cn("size-4 rounded-sm", className)}
      style={{ background: getThemeColor(color) }}
    />
  );
};

export default ChoiceIcon;
