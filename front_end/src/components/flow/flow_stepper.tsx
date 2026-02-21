"use client";

import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  createContext,
  FC,
  PropsWithChildren,
  ReactNode,
  useContext,
  useMemo,
} from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

export type FlowStepId = string | number;

export type FlowStep = {
  id: FlowStepId;
  isDone?: boolean;
};

type Ctx = {
  steps: FlowStep[];
  activeStepId: FlowStepId | null;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onSelectStep: (id: FlowStepId) => void;
};

const FlowStepperContext = createContext<Ctx | null>(null);

export const useFlowStepper = () => {
  const ctx = useContext(FlowStepperContext);
  if (!ctx) {
    throw new Error("useFlowStepper must be used within <FlowStepperRoot>");
  }
  return ctx;
};

type RootProps = PropsWithChildren<{
  steps: FlowStep[];
  activeStepId: FlowStepId | null;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onSelectStep: (id: FlowStepId) => void;
}>;

export const FlowStepperRoot: FC<RootProps> = ({
  steps,
  activeStepId,
  isMenuOpen,
  onToggleMenu,
  onSelectStep,
  children,
}) => {
  const value = useMemo(
    () => ({ steps, activeStepId, isMenuOpen, onToggleMenu, onSelectStep }),
    [steps, activeStepId, isMenuOpen, onToggleMenu, onSelectStep]
  );

  return (
    <FlowStepperContext.Provider value={value}>
      <div className="relative flex max-h-[calc(100dvh-48px)] w-full flex-col rounded-b bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:p-8 sm:py-[26px]">
        {children}
      </div>
    </FlowStepperContext.Provider>
  );
};

export const FlowStepperHeader: FC<{ label: ReactNode }> = ({ label }) => {
  return (
    <div className="flex items-center justify-between">
      <p className="m-0 text-lg font-medium leading-7">{label}</p>
      <FlowStepperMenuToggle />
    </div>
  );
};

export const FlowStepperMenuToggle: FC = () => {
  const { isMenuOpen, onToggleMenu } = useFlowStepper();
  return (
    <Button
      variant="tertiary"
      onClick={onToggleMenu}
      className="h-8 w-8 rounded-full px-2 py-2"
    >
      <FontAwesomeIcon
        icon={isMenuOpen ? faXmark : faBars}
        className={cn({
          "h-[16px] w-[14px]": !isMenuOpen,
          "h-[16px] w-[16px]": isMenuOpen,
        })}
      />
    </Button>
  );
};

export const FlowStepperSegments: FC = () => {
  const { steps } = useFlowStepper();
  return (
    <div className="mt-4 flex gap-0.5">
      {steps.map((s, i) => (
        <FlowStepperSegment key={s.id} stepId={s.id} index={i} />
      ))}
    </div>
  );
};

type SegmentProps = { stepId: FlowStepId; index: number };

export const FlowStepperSegment: FC<SegmentProps> = ({ stepId, index }) => {
  const { steps, activeStepId, onSelectStep } = useFlowStepper();
  const step = steps.find((s) => s.id === stepId);
  const isActive = stepId === activeStepId;
  const isDone = !!step?.isDone;

  return (
    <Button
      variant="primary"
      className={cn(
        "h-3 max-h-3 w-full rounded-none border-2 border-transparent bg-gray-300 p-0 hover:border-transparent hover:bg-gray-400 dark:border-transparent dark:bg-gray-300-dark dark:hover:border-transparent dark:hover:bg-gray-400-dark",
        {
          "rounded-l": index === 0,
          "rounded-r": index === steps.length - 1,
          "border-blue-600 bg-blue-200 hover:border-blue-600 hover:bg-gray-300 dark:border-blue-600-dark dark:bg-blue-200-dark dark:hover:border-blue-600-dark dark:hover:bg-gray-300-dark":
            isActive,
          "bg-olive-500 hover:bg-olive-600 dark:bg-olive-500-dark dark:hover:bg-olive-600-dark":
            isDone,
          "border-olive-800 dark:border-olive-800-dark": isDone && isActive,
        }
      )}
      onClick={() => onSelectStep(stepId)}
      aria-label={`Step ${index + 1}`}
    />
  );
};

export const FlowStepperNav: FC<PropsWithChildren> = ({ children }) => {
  return <div className="mt-4 flex justify-between gap-2">{children}</div>;
};

export const FlowStepperNavPrev: FC<
  PropsWithChildren<{ disabled?: boolean; onClick?: () => void }>
> = ({ disabled, onClick, children }) => {
  return (
    <Button variant="tertiary" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
};

export const FlowStepperNavNext: FC<
  PropsWithChildren<{
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
  }>
> = ({ disabled, className, onClick, children }) => {
  return (
    <Button
      variant="tertiary"
      onClick={onClick}
      disabled={disabled}
      className={cn("capitalize", className)}
    >
      {children}
    </Button>
  );
};

export const FlowStepperMenu: FC<PropsWithChildren> = ({ children }) => {
  const { isMenuOpen } = useFlowStepper();
  if (!isMenuOpen) return null;
  return <>{children}</>;
};
