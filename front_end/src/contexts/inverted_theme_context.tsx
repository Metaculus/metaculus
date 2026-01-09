"use client";

import { ComponentProps, createContext, useContext } from "react";

import cn from "@/utils/core/cn";

type InvertedThemeContextType = boolean;

const InvertedThemeContext = createContext<InvertedThemeContextType>(false);

export function InvertedThemeContainer({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <InvertedThemeContext.Provider value={true}>
      <div className={cn("inverted", className)} {...props}>
        {children}
      </div>
    </InvertedThemeContext.Provider>
  );
}

export default function useInvertedThemeContext() {
  return useContext(InvertedThemeContext);
}
