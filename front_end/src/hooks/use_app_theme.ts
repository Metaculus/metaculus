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
import { useThemeOverride } from "@/contexts/theme_override_context";
import { AppTheme, ThemeColor } from "@/types/theme";
import { logError } from "@/utils/core/errors";

const useAppTheme = () => {
  const {
    theme: themeChoice,
    resolvedTheme,
    setTheme: setNextTheme,
    forcedTheme,
  } = useTheme();
  const [isSyncing, setIsSyncing] = useState<boolean>();
  const { user, setUser } = useAuth();
  const themeOverride = useThemeOverride();

  const theme = useMemo(() => {
    if (themeOverride === "light") return "light" as AppTheme;
    const base = (forcedTheme ?? resolvedTheme ?? "light") as AppTheme;
    if (themeOverride === "inverted") {
      return base === "dark" ? ("light" as AppTheme) : ("dark" as AppTheme);
    }
    return base;
  }, [themeOverride, forcedTheme, resolvedTheme]);

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
      return theme === "dark" ? color.dark : color.DEFAULT;
    },
    [theme]
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
