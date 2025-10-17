"use client";

import {
  ButtonHTMLAttributes,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

type TabsVariant = "separated" | "group";
type TabsContextValue = {
  variant: TabsVariant;
  active: string;
  setActive: (v: string) => void;
};
const TabsContext = createContext<TabsContextValue | null>(null);
TabsContext.displayName = "TabsContext";

export function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("useTabsContext must be used within <Tabs>");
  }
  return ctx;
}

export const Tabs = ({
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className,
  variant = "separated",
}: {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  variant?: TabsVariant;
}) => {
  const [internalActive, setInternalActive] = useState(defaultValue);

  // Support both controlled and uncontrolled modes
  const active = controlledValue ?? internalActive;
  const setActive = useCallback(
    (v: string) => {
      if (onChange) {
        onChange(v);
      } else {
        setInternalActive(v);
      }
    },
    [onChange]
  );
  const value = useMemo(
    () => ({ active, setActive, variant }),
    [active, variant, setActive]
  );

  return (
    <TabsContext.Provider value={value}>
      <div className={cn("bg-gray-0 dark:bg-gray-0-dark", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ctx = useTabsContext();
  return (
    <div
      className={cn(
        "scrollbar-none z-10 -mx-4 flex overflow-x-auto bg-blue-200 px-4 py-3 dark:bg-blue-200-dark",
        ctx.variant === "separated" && "sticky top-12 gap-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export const TabsTab = ({
  value,
  children,
  icon,
  className,
  onSelect,
  scrollOnSelect = true,
  ...buttonProps
}: {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onSelect?: (value: string) => void;
  scrollOnSelect?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
  const ctx = useTabsContext();
  const isActive = ctx.active === value;

  const HEADER_OFFSET = 60;
  const handleClick = (value: string, target: HTMLElement) => {
    ctx.setActive(value);
    const elementTop = target.getBoundingClientRect().top + window.scrollY;

    if (!scrollOnSelect) return;
    window.scrollTo({
      top: elementTop - HEADER_OFFSET,
      behavior: "smooth",
    });
  };

  return (
    <button
      {...buttonProps}
      className={cn(
        "whitespace-nowrap transition-colors",
        isActive
          ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
          : "bg-gray-0  dark:bg-gray-0-dark ",
        ctx.variant === "separated" && [
          "rounded-full px-3 py-1 text-sm",
          !isActive && "text-gray-800 dark:text-gray-800-dark",
        ],
        ctx.variant === "group" && [
          "first:rounded-l-full",
          "last:rounded-r-full",
          "[&:not(:first-child)]:-ml-px",
          "border text-sm leading-[16px] sm:text-lg sm:leading-[26px]",
          "px-3 py-1 font-[500] sm:px-5 sm:py-1.5",
          !isActive && "text-blue-700 dark:text-blue-700-dark",
          isActive
            ? "border-transparent"
            : "border-blue-400 dark:border-blue-400",
        ],
        className
      )}
      onClick={(e) => {
        ctx.setActive(value);
        if (scrollOnSelect) {
          (e.target as HTMLElement).scrollIntoView({
            inline: "center",
            behavior: "smooth",
          });
        }

        if (e.target instanceof HTMLElement) {
          handleClick(value, e.target);
        }
        onSelect?.(value);
      }}
    >
      {icon ? (
        <span className="mt-[1px] inline-flex items-center gap-2 sm:gap-3">
          {icon}
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export function TabsSection({
  value,
  children,
  className,
  suppress,
  placeholder,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  suppress?: boolean;
  placeholder?: ReactNode;
}) {
  const ctx = useTabsContext();
  const ref = useRef<HTMLDivElement>(null);

  if (ctx.active !== value) {
    return null;
  }

  if (suppress) {
    return placeholder;
  }

  return (
    <div ref={ref} className={cn("mt-4", className)}>
      {children}
    </div>
  );
}
