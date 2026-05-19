"use client";

import {
  ComponentProps,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { flushSync } from "react-dom";

import cn from "@/utils/core/cn";

export type ThemeOverride = "light" | "inverted" | null;

// --- Print Override (global, layout-level) ---

const PrintOverrideContext = createContext<ThemeOverride>(null);

export function PrintOverrideProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [printOverride, setPrintOverride] = useState<ThemeOverride>(null);

  useEffect(() => {
    const onBefore = () => {
      document.documentElement.classList.add("force-light");
      flushSync(() => setPrintOverride("light"));
    };
    const onAfter = () => {
      document.documentElement.classList.remove("force-light");
      flushSync(() => setPrintOverride(null));
    };
    window.addEventListener("beforeprint", onBefore);
    window.addEventListener("afterprint", onAfter);
    return () => {
      window.removeEventListener("beforeprint", onBefore);
      window.removeEventListener("afterprint", onAfter);
    };
  }, []);

  return (
    <PrintOverrideContext.Provider value={printOverride}>
      {children}
    </PrintOverrideContext.Provider>
  );
}

// --- Local Override (scoped, component-level) ---

const LocalOverrideContext = createContext<ThemeOverride>(null);

const OVERRIDE_CLASS_MAP: Record<string, string> = {
  light: "force-light",
  inverted: "inverted",
};

export function ThemeOverrideContainer({
  override,
  children,
  className,
  ...props
}: ComponentProps<"div"> & { override: ThemeOverride }) {
  const cssClass = override ? OVERRIDE_CLASS_MAP[override] : undefined;
  return (
    <LocalOverrideContext.Provider value={override}>
      <div className={cn(cssClass, className)} {...props}>
        {children}
      </div>
    </LocalOverrideContext.Provider>
  );
}

// --- Hook ---
export function usePrintOverride(): boolean {
  return useContext(PrintOverrideContext) === "light";
}

export function useThemeOverride(): ThemeOverride {
  const printOverride = useContext(PrintOverrideContext);
  const localOverride = useContext(LocalOverrideContext);
  return printOverride ?? localOverride ?? null;
}
