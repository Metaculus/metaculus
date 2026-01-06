"use client";

import Link from "next/link";
import {
  ButtonHTMLAttributes,
  createContext,
  MouseEventHandler,
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
        "scrollbar-none z-10 -mx-3 flex overflow-x-auto bg-blue-200 px-3 py-3 dark:bg-blue-200-dark sm:-mx-4 sm:px-4",
        ctx.variant === "separated" ? "sticky top-12 gap-2" : "gap-2", // non-sticky for "group" to keep both behaviours valid
        className
      )}
    >
      {children}
    </div>
  );
};

type TabsTabProps = {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onSelect?: (value: string) => void;
  scrollOnSelect?: boolean;
  href?: string;
  dynamicClassName?: (isActive: boolean) => string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const TabsTab = ({
  value,
  children,
  icon,
  className,
  onSelect,
  scrollOnSelect = true,
  href,
  dynamicClassName,
  ...buttonProps
}: TabsTabProps) => {
  const ctx = useTabsContext();
  const isActive = ctx.active === value;
  const HEADER_OFFSET = 60;

  const baseClass = cn(
    "whitespace-nowrap px-3 py-1 text-sm transition-colors sm:px-5 sm:py-1.5 sm:text-lg sm:leading-[26px]",
    ctx.variant === "separated"
      ? [
          // pill-style tabs
          "rounded-full",
          isActive
            ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
            : "bg-gray-0 text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark",
        ]
      : [
          // grouped / segmented control style
          "border font-[500] items-center flex no-underline leading-[16px] first:rounded-l-full last:rounded-r-full [&:not(:first-child)]:-ml-px",
          isActive
            ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark border-transparent"
            : "bg-gray-0 dark:bg-gray-0-dark border-blue-400 text-blue-700 dark:border-blue-400 dark:text-blue-700-dark",
        ],
    dynamicClassName?.(isActive),
    className
  );

  const handleTabClick: MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement
  > = (e) => {
    ctx.setActive(value);

    if (!href && scrollOnSelect) {
      const target = e.currentTarget;

      target.scrollIntoView({
        inline: "center",
        behavior: "smooth",
      });

      const top = target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - HEADER_OFFSET, behavior: "smooth" });
    }

    onSelect?.(value);
  };

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    handleTabClick(e);
    buttonProps.onClick?.(e);
  };

  const inner = icon ? (
    <span className="mt-[1px] inline-flex items-center gap-2 sm:gap-3">
      {icon}
      <span>{children}</span>
    </span>
  ) : (
    children
  );

  return href ? (
    <Link href={href} className={baseClass} onClick={handleTabClick}>
      {inner}
    </Link>
  ) : (
    <button
      type="button"
      {...buttonProps}
      className={baseClass}
      onClick={handleButtonClick}
    >
      {inner}
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
