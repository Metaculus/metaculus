"use client";
import { useSearchParams } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { FC, PropsWithChildren, useEffect, useLayoutEffect } from "react";

import { ENFORCED_THEME_PARAM } from "@/constants/global_search_params";
import { useAuth } from "@/contexts/auth_context";
import { AppTheme } from "@/types/theme";

const THEME_STORAGE_KEY = "theme";

// prevent cross-tab flicker: stop `storage` events for our theme key so this tab
// doesn’t react to other tabs changing localStorage.
// (only affects cross-tab sync; in-tab behavior unchanged.)
const BlockCrossTabThemeSync: FC = () => {
  useLayoutEffect(() => {
    const swallow = (e: StorageEvent) => {
      if (e.storageArea === localStorage && e.key === THEME_STORAGE_KEY) {
        e.stopImmediatePropagation?.();
      }
    };
    window.addEventListener("storage", swallow, true);
    window.addEventListener("storage", swallow, false);
    return () => {
      window.removeEventListener("storage", swallow, true);
      window.removeEventListener("storage", swallow, false);
    };
  }, []);
  return null;
};

const AppThemeProvided: FC<PropsWithChildren> = ({ children }) => {
  const params = useSearchParams();
  const themeParam = params.get(ENFORCED_THEME_PARAM) as AppTheme | null;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={themeParam ?? undefined}
    >
      <BlockCrossTabThemeSync />
      <InnerTheme>{children}</InnerTheme>
    </ThemeProvider>
  );
};

const InnerTheme: FC<PropsWithChildren> = ({ children }) => {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();

  // Sync user db settings with localStorage theme configuration
  useEffect(() => {
    if (user?.app_theme && user.app_theme !== theme) {
      console.log(
        `Synchronized current theme with user.app_theme settings: ${user.app_theme}`
      );
      setTheme(user.app_theme);
    }
  }, [setTheme, theme, user?.app_theme]);

  return <>{children}</>;
};

export default AppThemeProvided;
