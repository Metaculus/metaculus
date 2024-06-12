import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

import Button from "./button";

export interface MenuItem {
  id: string;
  name?: string;
  onClick?: (...args: unknown[]) => unknown;
  link?: string;
  openNewTab?: boolean;
}

interface DropdownMenuProps extends React.PropsWithChildren {
  items: MenuItem[];
  textAlign?: "left" | "right";
}

const defaultButton = (
  <Button aria-label="menu" variant="tertiary" size="md">
    <FontAwesomeIcon icon={faEllipsis} />
  </Button>
);

export default function DropdownMenu({
  items,
  children = defaultButton,
  textAlign = "right",
}: DropdownMenuProps) {
  return (
    <Menu as="div" className="relative text-gray-900 dark:text-gray-900-dark">
      <Menu.Button as={Fragment}>{children}</Menu.Button>
      <Menu.Items
        as="div"
        className="absolute right-0 z-50 mt-1 flex origin-top-right flex-col overflow-y-auto rounded border border-gray-500 bg-gray-0 text-sm drop-shadow-lg dark:border-gray-500-dark dark:bg-gray-0-dark"
      >
        {items.map((item) => (
          <Menu.Item as={Fragment} key={item.id}>
            {({ active }) =>
              item.link ? (
                <a
                  target={item.openNewTab ? "_blank" : undefined}
                  rel="noreferrer"
                  href={item.link}
                  className={clsx(
                    "w-full whitespace-nowrap p-2 no-underline",
                    {
                      "bg-gray-200 dark:bg-gray-200-dark": active,
                    },
                    { "text-right": textAlign === "right" },
                    { "text-left": textAlign === "left" }
                  )}
                  onClick={item.onClick}
                >
                  {item.name}
                </a>
              ) : (
                <button
                  className={clsx(
                    "w-full self-stretch whitespace-nowrap p-2",
                    {
                      "bg-gray-200 dark:bg-gray-200-dark": active,
                    },
                    { "text-right": textAlign === "right" },
                    { "text-left": textAlign === "left" }
                  )}
                  onClick={item.onClick}
                >
                  {item.name}
                </button>
              )
            }
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
}
