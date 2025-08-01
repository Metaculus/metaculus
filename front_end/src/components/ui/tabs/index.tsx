"use client";

import {
  useRef,
  useContext,
  createContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

type TabsContextValue = {
  active: string;
  setActive: (v: string) => void;
  registerSection: (value: string, ref: HTMLElement | null) => void;
  sections: Record<string, HTMLElement | null>;
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
  const [sections, setSections] = useState<Record<string, HTMLElement | null>>(
    {}
  );

  const { theme, getThemeColor } = useAppTheme();

  const registerSection = useCallback(
    (value: string, ref: HTMLElement | null) => {
      setSections((prev) => {
        if (prev[value] === ref) return prev;
        return { ...prev, [value]: ref };
      });
    },
    []
  );
  if (!theme) {
    return null;
  }

  const bgColor = getThemeColor(METAC_COLORS.gray[0]);

  return (
    <TabsContext.Provider
      value={{ active, setActive, registerSection, sections }}
    >
      <div
        className={cn("sticky top-0 z-10", className)}
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
  return <div className="flex gap-2 overflow-x-auto">{children}</div>;
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

        const target = ctx.sections[value];
        if (target)
          target.scrollIntoView({ behavior: "smooth", block: "start" });
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
  const registered = useRef(false);

  useEffect(() => {
    if (!registered.current && ref.current) {
      ctx.registerSection(value, ref.current);
      registered.current = true;
    }
  }, [ctx, value]);

  if (ctx.active !== value) {
    return null;
  }

  return (
    <div ref={ref} className="mt-4">
      {children}
    </div>
  );
}
