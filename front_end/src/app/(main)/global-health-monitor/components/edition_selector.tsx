"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { parseAsString, useQueryState } from "nuqs";
import { Fragment, useTransition } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { EditionLabel } from "../helpers/snapshot";

const stepButtonClassName =
  "flex items-center justify-center bg-gray-0 p-0 dark:bg-gray-0-dark print:hidden";

/** Steps through editions or picks one from a menu, like the weekly top comments selector. */
export function EditionSelector({
  editions,
  currentSlug,
  latestSlug,
  className,
}: {
  // Newest first.
  editions: EditionLabel[];
  currentSlug: string;
  latestSlug: string;
  className?: string;
}) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [, setEdition] = useQueryState(
    "edition",
    parseAsString.withOptions({
      shallow: false,
      scroll: false,
      history: "push",
      startTransition,
    })
  );

  const index = editions.findIndex((edition) => edition.slug === currentSlug);
  const current = editions[index];
  const older = editions[index + 1];
  const newer = index > 0 ? editions[index - 1] : undefined;
  const selectEdition = (slug: string) =>
    void setEdition(slug === latestSlug ? null : slug);

  return (
    <div
      className={cn(
        "flex w-fit min-w-[200px] items-center justify-between rounded border border-blue-500 bg-gray-0 px-3 py-2 transition-opacity dark:border-blue-500-dark dark:bg-gray-0-dark print:min-w-0 print:border-0 print:p-0",
        isPending && "opacity-60",
        className
      )}
    >
      <Button
        size="sm"
        variant="text"
        aria-label={t("previous")}
        disabled={!older || isPending}
        onClick={() => older && selectEdition(older.slug)}
        className={cn(stepButtonClassName, "mr-2")}
      >
        <FontAwesomeIcon
          icon={faChevronLeft}
          className="text-base text-blue-600 dark:text-blue-600-dark"
        />
      </Button>

      <Menu as="div" className="relative flex-1 text-center">
        <MenuButton className="cursor-pointer text-base font-medium leading-6 text-blue-700 dark:text-blue-700-dark">
          {current?.label}
        </MenuButton>
        <MenuItems
          as="div"
          anchor="bottom"
          className="z-[150] mt-2 w-[200px] origin-top overflow-hidden rounded border border-blue-500 bg-gray-0 shadow-lg dark:border-blue-500-dark dark:bg-gray-0-dark"
        >
          <div className="flex max-h-[187px] flex-col overflow-y-auto py-1">
            {editions.map((edition) => (
              <MenuItem as={Fragment} key={edition.slug}>
                <button
                  type="button"
                  onClick={() => selectEdition(edition.slug)}
                  className={cn(
                    "block w-full px-2.5 py-1 text-left text-sm leading-5 text-blue-700 hover:bg-gray-100 data-[focus]:bg-gray-100 dark:text-blue-700-dark hover:dark:bg-gray-100-dark data-[focus]:dark:bg-gray-100-dark",
                    edition.slug === currentSlug ? "font-bold" : "font-normal"
                  )}
                >
                  {edition.label}
                </button>
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Menu>

      <Button
        size="sm"
        variant="text"
        aria-label={t("next")}
        disabled={!newer || isPending}
        onClick={() => newer && selectEdition(newer.slug)}
        className={cn(stepButtonClassName, "ml-2")}
      >
        <FontAwesomeIcon
          icon={faChevronRight}
          className="text-base text-blue-600 dark:text-blue-600-dark"
        />
      </Button>
    </div>
  );
}
