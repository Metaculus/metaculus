import { useTheme } from "next-themes";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import { useAuth } from "@/contexts/auth_context";
import useInvertedThemeContext from "@/contexts/inverted_theme_context";
import { AppTheme, ThemeColor } from "@/types/theme";
import { logError } from "@/utils/core/errors";

const useAppTheme = () => {
  const {
    theme: themeChoice,
    resolvedTheme,
    setTheme: setNextTheme,
    forcedTheme,
  } = useTheme();
  const isInverted = useInvertedThemeContext();
  const [isSyncing, setIsSyncing] = useState<boolean>();
  const { user, setUser } = useAuth();

  const theme = useMemo(() => {
    return (forcedTheme ?? resolvedTheme ?? "light") as AppTheme;
  }, [forcedTheme, resolvedTheme]);

  const setTheme = useCallback(
    async (newTheme: AppTheme) => {
      // Immediately update NextTheme for instant visual feedback
      setNextTheme(newTheme);

      // For authenticated users, also save to backend
      if (user) {
        setIsSyncing(true);
        setUser({ ...user, app_theme: newTheme });

        updateProfileAction({ app_theme: newTheme }, false)
          .catch(logError)
          .finally(() => setIsSyncing(false));
      }
    },
    [setNextTheme, user, setUser]
  );

  const getThemeColor = useCallback(
    (color: ThemeColor) => {
      if (theme === "dark") {
        return isInverted ? color.DEFAULT : color.dark;
      }

      return isInverted ? color.dark : color.DEFAULT;
    },
    [theme, isInverted]
  );

  return {
    theme,
    // Currently selected theme. Could be dark, light or system
    themeChoice: themeChoice ?? AppTheme.System,
    isSyncing,
    setTheme: setTheme as Dispatch<SetStateAction<AppTheme>>,
    getThemeColor,
  };
};

export default useAppTheme;
