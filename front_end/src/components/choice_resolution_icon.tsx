"use client";
import { FC } from "react";

import ResolutionIcon from "@/components/icons/resolution";
import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { ThemeColor } from "@/types/theme";

type Props = {
  color?: ThemeColor;
};

const ChoiceResolutionIcon: FC<Props> = ({ color }) => {
  const { getThemeColor } = useAppTheme();
  const mounted = useMounted();

  return (
    <ResolutionIcon
      className="text-purple-800 dark:text-purple-800-dark"
      style={{ color: mounted && color ? getThemeColor(color) : undefined }}
    />
  );
};

export default ChoiceResolutionIcon;
