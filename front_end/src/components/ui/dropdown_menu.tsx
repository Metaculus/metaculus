"use client";

import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Menu,
  MenuItem,
  MenuItems,
  MenuButton,
  Portal,
} from "@headlessui/react";
import { isNil } from "lodash";
import {
  Fragment,
  MouseEventHandler,
  ReactElement,
  useEffect,
  useState,
} from "react";

import cn from "@/utils/core/cn";

import Button from "./button";

export type MenuItemProps = {
  id: string;
  name?: string;
  onClick?: MouseEventHandler;
  link?: string;
  items?: MenuItemProps[];
  openNewTab?: boolean;
  hidden?: boolean;
  element?: ReactElement;
  className?: string;
};

interface DropdownMenuProps extends React.PropsWithChildren {
  items: MenuItemProps[];
  textAlign?: "left" | "right";
  itemClassName?: string;
  className?: string;
  onClose?: () => void;
  innerDivClassName?: string;
}

const defaultButton = (
  <Button
    aria-label="menu"
    variant="tertiary"
    size="md"
    presentationType="icon"
  >
    <FontAwesomeIcon icon={faEllipsis} />
  </Button>
);

function InnerMenuContent({
  open,
  items,
  children = defaultButton,
  textAlign = "right",
  itemClassName,
  className,
  onClose,
}: DropdownMenuProps & { open: boolean }) {
  const [prevItems, setPrevItems] = useState<MenuItemProps[]>(items);
  const [activeItems, setActiveItems] = useState<MenuItemProps[]>(items);

  // Track prop change
  useEffect(() => {
    setPrevItems(items);
    setActiveItems(items);
  }, [items]);

  useEffect(() => {
    if (!open) {
      setActiveItems(prevItems);
      if (onClose) onClose();
    }
  }, [open, onClose, prevItems]);

  return (
    <>
      <MenuButton as={Fragment}>{children}</MenuButton>

      <Portal>
        <MenuItems
          as="div"
          anchor={textAlign === "right" ? "bottom end" : "bottom start"}
          className={cn(
            "z-[100] mt-1 flex origin-top flex-col overflow-y-auto rounded border",
            "border-gray-500 bg-gray-0 text-sm shadow-lg dark:border-gray-500-dark dark:bg-gray-0-dark",
            className
          )}
        >
          {activeItems
            .filter((x) => x.hidden !== true)
            .map((item) => (
              <MenuItem as={Fragment} key={item.id}>
                {() =>
                  item.link ? (
                    <a
                      target={item.openNewTab ? "_blank" : undefined}
                      rel="noreferrer"
                      href={item.link}
                      className={cn(
                        "w-full whitespace-nowrap p-2 no-underline hover:bg-gray-200 hover:dark:bg-gray-200-dark",
                        { "text-right": textAlign === "right" },
                        { "text-left": textAlign === "left" },
                        itemClassName,
                        item.className
                      )}
                      onClick={item.onClick}
                    >
                      {item.name}
                    </a>
                  ) : item.element ? (
                    item.element
                  ) : (
                    <button
                      className={cn(
                        "w-full self-stretch whitespace-nowrap p-2 hover:bg-gray-200 hover:dark:bg-gray-200-dark",
                        { "text-right": textAlign === "right" },
                        { "text-left": textAlign === "left" },
                        itemClassName,
                        item.className
                      )}
                      onClick={(e: React.MouseEvent<HTMLElement>) => {
                        // Handle nested click
                        if (!isNil(item.items) && item.items.length > 0) {
                          e.preventDefault();
                          setActiveItems(item.items);
                        }
                        if (!isNil(item.onClick)) item.onClick(e);
                      }}
                    >
                      {item.name}
                    </button>
                  )
                }
              </MenuItem>
            ))}
        </MenuItems>
      </Portal>
    </>
  );
}

export default function DropdownMenu({
  items,
  children = defaultButton,
  textAlign = "right",
  itemClassName,
  className,
  onClose,
  innerDivClassName,
}: DropdownMenuProps) {
  return (
    <Menu
      as="div"
      className={cn(
        "relative text-gray-900 dark:text-gray-900-dark",
        innerDivClassName
      )}
    >
      {({ open }) => (
        <InnerMenuContent
          open={open}
          items={items}
          textAlign={textAlign}
          itemClassName={itemClassName}
          className={className}
          onClose={onClose}
        >
          {children}
        </InnerMenuContent>
      )}
    </Menu>
  );
}
