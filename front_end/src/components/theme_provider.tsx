"use client";
import { useSearchParams } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { FC, PropsWithChildren, useEffect } from "react";

import { ENFORCED_THEME_PARAM } from "@/constants/global_search_params";
import { useAuth } from "@/contexts/auth_context";
import { AppTheme } from "@/types/theme";

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
      <InnerTheme>{children}</InnerTheme>
    </ThemeProvider>
  );
};

const InnerTheme: FC<PropsWithChildren> = ({ children }) => {
  const { setTheme } = useTheme();
  const { user } = useAuth();

  // Sync user db settings with localStorage theme configuration
  useEffect(() => {
    if (user?.app_theme) setTheme(user?.app_theme);
  }, [setTheme, user?.app_theme]);

  return <>{children}</>;
};

export default AppThemeProvided;
