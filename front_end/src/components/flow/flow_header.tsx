"use client";

import React, {
  createContext,
  FC,
  PropsWithChildren,
  ReactNode,
  useContext,
  useMemo,
} from "react";

import cn from "@/utils/core/cn";

type Ctx = {
  title: ReactNode;
};

const FlowHeaderContext = createContext<Ctx | null>(null);

const useFlowHeader = () => {
  const ctx = useContext(FlowHeaderContext);
  if (!ctx) {
    throw new Error("useFlowHeader must be used within <FlowHeaderRoot>");
  }
  return ctx;
};

type RootProps = PropsWithChildren<{
  className?: string;
  title: ReactNode;
}>;

export const FlowHeaderRoot: FC<RootProps> = ({
  className,
  title,
  children,
}) => {
  const value = useMemo(() => ({ title }), [title]);

  return (
    <FlowHeaderContext.Provider value={value}>
      <header
        className={cn(
          "flex h-12 w-full flex-auto flex-nowrap items-center justify-between bg-blue-900 text-gray-0",
          className
        )}
      >
        {children}
      </header>
    </FlowHeaderContext.Provider>
  );
};

export const FlowHeaderBrand: FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="flex h-full items-center">{children}</div>;
};

export const FlowHeaderTitle: FC = () => {
  const { title } = useFlowHeader();
  return (
    <div className="m-0 mx-3 max-w-[255px] truncate text-lg leading-7 md:absolute md:left-1/2 md:mx-0 md:max-w-[350px] md:-translate-x-1/2">
      {title}
    </div>
  );
};

export const FlowHeaderActions: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <div className="flex items-center">{children}</div>;
};
