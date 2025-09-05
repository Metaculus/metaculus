"use client";
import { FC } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";

type Props = {
  color?: ThemeColor;
  className?: string;
};

const ChoiceIcon: FC<Props> = ({
  color = METAC_COLORS["gray"]["400"],
  className,
}) => {
  const { getThemeColor } = useAppTheme();
  const mounted = useMounted();

  return (
    <div
      className={cn("size-4 rounded-sm", className)}
      style={{ background: mounted ? getThemeColor(color) : color.DEFAULT }}
    />
  );
};

export default ChoiceIcon;
