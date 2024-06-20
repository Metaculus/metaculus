import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useCallback } from "react";

export type AppTheme = "light" | "dark";

const useAppTheme = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const getThemeColor = useCallback(
    (color: { DEFAULT: string; dark: string }) => {
      if (resolvedTheme === "dark") {
        return color.dark;
      }

      return color.DEFAULT;
    },
    [resolvedTheme]
  );

  return {
    theme: resolvedTheme as AppTheme,
    setTheme: setTheme as Dispatch<SetStateAction<AppTheme>>,
    getThemeColor,
  };
};

export default useAppTheme;
