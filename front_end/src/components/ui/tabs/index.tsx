"use client";

import { createContext, ReactNode, useContext, useRef, useState } from "react";

import cn from "@/utils/core/cn";

type TabsContextValue = {
  active: string;
  setActive: (v: string) => void;
};
const TabsContext = createContext<TabsContextValue | null>(null);

export const Tabs = ({
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className,
}: {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}) => {
  const [internalActive, setInternalActive] = useState(defaultValue);

  // Support both controlled and uncontrolled modes
  const active = controlledValue ?? internalActive;
  const setActive = (v: string) => {
    if (onChange) {
      onChange(v);
    } else {
      setInternalActive(v);
    }
  };

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn("bg-gray-0 dark:bg-gray-0-dark", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children }: { children: ReactNode }) => {
  return (
    <div className="scrollbar-none sticky top-12 z-10 -mx-4 flex gap-2 overflow-x-auto bg-blue-200 px-4 py-3 dark:bg-blue-200-dark">
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

  if (!ctx) throw new Error("Tabs.Tab must be inside <Tabs>");

  const isActive = ctx.active === value;

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
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors",
        isActive
          ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
          : "bg-gray-0 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark"
      )}
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
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs.Section must be inside <Tabs>");
  const ref = useRef<HTMLDivElement>(null);

  if (ctx.active !== value) {
    return null;
  }

  return (
    <div ref={ref} className={cn("mt-4", className)}>
      {children}
    </div>
  );
}
