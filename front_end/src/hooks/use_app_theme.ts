import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import { useAuth } from "@/contexts/auth_context";
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

  const setTheme = useCallback(
    async (newTheme: AppTheme) => {
      // Immediately update NextTheme for instant visual feedback
      setNextTheme(newTheme);

      // For authenticated users, also save to backend
      if (user) {
        setIsSyncing(true);
        setUser({ ...user, app_theme: newTheme });

        try {
          await updateProfileAction({ app_theme: newTheme }, false);
        } catch (error) {
          logError(error);
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [setNextTheme, user, setUser]
  );

  const getThemeColor = useCallback(
    (color: ThemeColor) => {
      if (resolvedTheme === "dark") {
        return color.dark;
      }

      return color.DEFAULT;
    },
    [resolvedTheme]
  );

  return {
    // Currently active theme respecting Forced selection
    // Could be dark or light
    theme: (forcedTheme ?? resolvedTheme) as AppTheme,
    // Currently selected theme. Could be dark, light or system
    themeChoice: themeChoice ?? AppTheme.System,
    isSyncing,
    setTheme: setTheme as Dispatch<SetStateAction<AppTheme>>,
    getThemeColor,
  };
};

export default useAppTheme;
