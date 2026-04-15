"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { cva, type VariantProps } from "class-variance-authority";
import { FC, PropsWithChildren, ReactNode, useState } from "react";

import { usePrintOverride } from "@/contexts/theme_override_context";
import cn from "@/utils/core/cn";

const sectionContainerVariants = cva(
  "break-inside-avoid rounded print:border print:border-gray-300",
  {
    variants: {
      variant: {
        primary: "bg-blue-200 dark:bg-blue-200-dark",
        light: "bg-gray-0 dark:bg-gray-0-dark",
        gold: "bg-gold-200 dark:bg-gold-200-dark",
        orange: "bg-orange-100 dark:bg-orange-100-dark",
        transparent: "bg-transparent dark:bg-transparent",
        dark: "bg-blue-200 dark:bg-blue-200-dark",
      },
      open: {
        true: null,
        false: "bg-opacity-50",
      },
    },
    defaultVariants: {
      variant: "primary",
      open: false,
    },
  }
);

const triggerVariants = cva("flex w-full items-center gap-2.5 p-3 text-base", {
  variants: {
    variant: {
      primary: "hover:text-blue-700 hover:dark:text-blue-700-dark",
      light: "hover:text-blue-700 hover:dark:text-blue-700-dark xs:px-4",
      gold: "hover:text-gray-800 hover:dark:text-gray-800-dark",
      orange: "hover:text-orange-900 hover:dark:text-orange-900-dark",
      transparent: null,
      dark: "hover:text-blue-900 hover:dark:text-blue-900-dark",
    },
    open: {
      true: null,
      false: null,
    },
  },
  compoundVariants: [
    {
      variant: "primary",
      open: true,
      class: "text-blue-700 dark:text-blue-700-dark",
    },
    {
      variant: "primary",
      open: false,
      class: "text-blue-600 dark:text-blue-600-dark",
    },
    {
      variant: "light",
      open: true,
      class: "text-blue-700 dark:text-blue-700-dark",
    },
    {
      variant: "light",
      open: false,
      class: "text-blue-600 dark:text-blue-600-dark",
    },
    {
      variant: "gold",
      open: true,
      class: "text-gray-800 dark:text-gray-800-dark",
    },
    {
      variant: "gold",
      open: false,
      class: "text-gray-600 dark:text-gray-600-dark",
    },
    {
      variant: "orange",
      open: true,
      class: "text-orange-900 dark:text-orange-900-dark",
    },
    {
      variant: "orange",
      open: false,
      class: "text-orange-800 dark:text-orange-800-dark",
    },
    {
      variant: "dark",
      open: true,
      class: "text-blue-900 dark:text-blue-900-dark",
    },
    {
      variant: "dark",
      open: false,
      class: "text-blue-800 dark:text-blue-800-dark",
    },
  ],
  defaultVariants: {
    variant: "primary",
    open: false,
  },
});

const iconVariants = cva("h-4 duration-75 ease-linear print:hidden", {
  variants: {
    variant: {
      primary: "text-blue-500 dark:text-blue-500-dark",
      light: "text-blue-500 dark:text-blue-500-dark",
      gold: null,
      orange: null,
      transparent: null,
      dark: "text-blue-900 dark:text-blue-900-dark",
    },
    open: {
      true: "rotate-180",
      false: null,
    },
  },
  defaultVariants: {
    variant: "primary",
    open: false,
  },
});

const panelVariants = cva("[&:not([hidden])]:px-3 [&:not([hidden])]:pb-3", {
  variants: {
    variant: {
      primary: null,
      light: "xs:[&:not([hidden])]:px-4",
      gold: null,
      orange: null,
      transparent: null,
      dark: null,
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});

export type SectionVariant = NonNullable<
  VariantProps<typeof sectionContainerVariants>["variant"]
>;

type Props = {
  title?: string;
  defaultOpen?: boolean;
  className?: string;
  wrapperClassName?: string;
  contentWrapperClassName?: string;
  variant?: SectionVariant;
  id?: string;
  detailElement?: ((isOpen: boolean) => ReactNode) | ReactNode | null;
  hiddenUntilFound?: boolean;
};

const SectionToggle: FC<PropsWithChildren<Props>> = ({
  id,
  variant = "primary",
  title,
  defaultOpen = false,
  className,
  wrapperClassName,
  contentWrapperClassName,
  children,
  detailElement,
  hiddenUntilFound,
}) => {
  const isPrintMode = usePrintOverride();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const open = isPrintMode || isOpen;

  return (
    <Collapsible.Root
      id={id}
      open={open}
      onOpenChange={setIsOpen}
      className={wrapperClassName}
    >
      <div className={sectionContainerVariants({ variant, open })}>
        <Collapsible.Trigger className="w-full">
          <div className={cn(triggerVariants({ variant, open }), className)}>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={iconVariants({ variant, open })}
            />
            <span>{title}</span>
            {typeof detailElement === "function"
              ? detailElement(open)
              : detailElement}
          </div>
        </Collapsible.Trigger>
        <Collapsible.Panel
          hiddenUntilFound={hiddenUntilFound}
          className={cn(panelVariants({ variant }), contentWrapperClassName)}
        >
          {children}
        </Collapsible.Panel>
      </div>
    </Collapsible.Root>
  );
};

export default SectionToggle;
