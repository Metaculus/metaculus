import { useTheme } from "next-themes";
import { Dispatch, SetStateAction } from "react";

export type AppTheme = "light" | "dark";

const useAppTheme = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return {
    theme: resolvedTheme as AppTheme,
    setTheme: setTheme as Dispatch<SetStateAction<AppTheme>>,
  };
};

export default useAppTheme;
