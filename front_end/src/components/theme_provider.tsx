"use client";
import { useSearchParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { FC, PropsWithChildren } from "react";

import { ENFORCED_THEME_PARAM } from "@/constants/global_search_params";
import { useAuth } from "@/contexts/auth_context";
import { AppTheme } from "@/types/theme";

const AppThemeProvided: FC<PropsWithChildren> = ({ children }) => {
  const params = useSearchParams();
  const themeParam = params.get(ENFORCED_THEME_PARAM) as AppTheme | null;
  const { user } = useAuth();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      forcedTheme={themeParam ?? user?.app_theme ?? undefined}
    >
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvided;
