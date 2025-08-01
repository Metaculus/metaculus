"use client";

import { createContext, ReactNode, useContext, useRef, useState } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

type TabsContextValue = {
  active: string;
  setActive: (v: string) => void;
};
const TabsContext = createContext<TabsContextValue | null>(null);

export const Tabs = ({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}) => {
  const [active, setActive] = useState(defaultValue);
  const { theme, getThemeColor } = useAppTheme();
  if (!theme) {
    return null;
  }

  const bgColor = getThemeColor(METAC_COLORS.gray[0]);

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div
        className={cn(className)}
        style={{
          backgroundColor: bgColor,
        }}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children }: { children: ReactNode }) => {
  const { getThemeColor } = useAppTheme();
  const backgroundColor = getThemeColor(METAC_COLORS.gray[0]);
  return (
    <div
      className="sticky top-12 z-10  flex gap-2 overflow-x-auto pb-1 pt-2"
      style={{
        backgroundColor,
      }}
    >
      {children}
    </div>
  );
};

export const TabsTab = ({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) => {
  const ctx = useContext(TabsContext);
  const { getThemeColor } = useAppTheme();

  if (!ctx) throw new Error("Tabs.Tab must be inside <Tabs>");

  const isActive = ctx.active === value;
  const activeBg = getThemeColor(METAC_COLORS.blue[800]);
  const activeText = getThemeColor(METAC_COLORS.gray[0]);
  const inactiveBg = getThemeColor(METAC_COLORS.gray[200]);
  const inactiveText = getThemeColor(METAC_COLORS.gray[800]);

  const HEADER_OFFSET = 60;
  const handleClick = (value: string, target: HTMLElement) => {
    ctx.setActive(value);
    const elementTop = target.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: elementTop - HEADER_OFFSET,
      behavior: "smooth",
    });
  };

  return (
    <button
      style={{
        backgroundColor: isActive ? activeBg : inactiveBg,
        color: isActive ? activeText : inactiveText,
      }}
      className="whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors"
      onClick={(e) => {
        ctx.setActive(value);
        (e.target as HTMLElement).scrollIntoView({
          inline: "center",
          behavior: "smooth",
        });

        if (e.target instanceof HTMLElement) {
          handleClick(value, e.target);
        }
      }}
    >
      {children}
    </button>
  );
};

export function TabsSection({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.Section must be inside <Tabs>");
  const ref = useRef<HTMLDivElement>(null);

  if (ctx.active !== value) {
    return null;
  }

  return (
    <div ref={ref} className="mt-4">
      {children}
    </div>
  );
}
