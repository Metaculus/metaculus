import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuItem, MenuItems, MenuButton } from "@headlessui/react";
import { Fragment, useEffect } from "react";

import cn from "@/utils/cn";

import Button from "./button";

export type MenuItemProps = {
  id: string;
  name?: string;
  onClick?: (...args: unknown[]) => unknown;
  link?: string;
  openNewTab?: boolean;
  hidden?: boolean;
  element?: React.ReactElement;
};

interface DropdownMenuProps extends React.PropsWithChildren {
  items: MenuItemProps[];
  textAlign?: "left" | "right";
  itemClassName?: string;
  className?: string;
  onClose?: () => void;
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
  useEffect(() => {
    if (!open && onClose) {
      onClose();
    }
  }, [open, onClose]);

  return (
    <>
      <MenuButton as={Fragment}>{children}</MenuButton>
      <MenuItems
        as="div"
        className={cn(
          "absolute right-0 z-50 mt-1 flex origin-top-right flex-col overflow-y-auto rounded border border-gray-500 bg-gray-0 text-sm drop-shadow-lg dark:border-gray-500-dark dark:bg-gray-0-dark",
          className
        )}
      >
        {items
          .filter((x) => x.hidden !== true)
          .map((item) => (
            <MenuItem as={Fragment} key={item.id}>
              {({}) =>
                item.link ? (
                  <a
                    target={item.openNewTab ? "_blank" : undefined}
                    rel="noreferrer"
                    href={item.link}
                    className={cn(
                      "w-full whitespace-nowrap p-2 no-underline hover:bg-gray-200 hover:dark:bg-gray-200-dark",
                      { "text-right": textAlign === "right" },
                      { "text-left": textAlign === "left" },
                      itemClassName
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
                      itemClassName
                    )}
                    onClick={item.onClick}
                  >
                    {item.name}
                  </button>
                )
              }
            </MenuItem>
          ))}
      </MenuItems>
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
}: DropdownMenuProps) {
  return (
    <Menu as="div" className="relative text-gray-900 dark:text-gray-900-dark">
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
