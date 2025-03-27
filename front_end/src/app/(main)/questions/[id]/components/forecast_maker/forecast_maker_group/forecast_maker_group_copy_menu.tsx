import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import { ContinuousGroupOption } from "@/app/(main)/questions/[id]/components/forecast_maker/continuous_group_accordion/group_forecast_accordion";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { Post } from "@/types/post";
import cn from "@/utils/cn";

type Props = {
  option: ContinuousGroupOption;
  options: ContinuousGroupOption[];
  post?: Post;
  handleCopy: (fromOptionId: number, toOptionId: number) => void;
};

const ForecastMakerGroupCopyMenu: FC<Props> = ({
  option,
  options,
  handleCopy,
}) => {
  const t = useTranslations();

  // Callback to copy the current option to all others
  const handleCopyToAll = useCallback(() => {
    options.forEach((toOption) => {
      if (toOption.id !== option.id) {
        handleCopy(option.id, toOption.id);
      }
    });
  }, [handleCopy, options, option.id]);

  const [menuMode, setMenuMode] = useState<"main" | "copyTo" | "copyFrom">(
    "main"
  );

  const menuItems: MenuItemProps[] = useMemo(() => {
    if (menuMode === "main") {
      return [
        {
          id: "forecastCopyToAll",
          name: t("forecastCopyToAll"),
          onClick: handleCopyToAll,
        },
        {
          id: "forecastCopyTo",
          name: t("forecastCopyTo"),
          onClick: (e: any) => {
            e.preventDefault();
            setMenuMode("copyTo");
          },
        },
        {
          id: "forecastCopyFrom",
          name: t("forecastCopyFrom"),
          onClick: (e: any) => {
            e.preventDefault();
            setMenuMode("copyFrom");
          },
        },
      ];
    } else if (menuMode === "copyTo") {
      return options
        .filter((o) => o.id !== option.id)
        .map((targetOption) => ({
          id: `copyTo${targetOption.id}`,
          element: (
            <button
              className={cn(
                "w-full self-stretch whitespace-nowrap p-2 text-right hover:bg-gray-200 hover:dark:bg-gray-200-dark"
              )}
              onClick={() => {
                handleCopy(option.id, targetOption.id);
              }}
            >
              {t.rich("forecastCopyToRich", {
                label: (element) => (
                  <span className="opacity-50">{element}</span>
                ),
                title: targetOption.name,
              })}
            </button>
          ),
        }));
    } else if (menuMode === "copyFrom") {
      return options
        .filter((o) => o.id !== option.id)
        .map((targetOption) => ({
          id: `copyFrom${targetOption.id}`,
          element: (
            <button
              className={cn(
                "w-full self-stretch whitespace-nowrap p-2 text-right hover:bg-gray-200 hover:dark:bg-gray-200-dark"
              )}
              onClick={() => {
                handleCopy(targetOption.id, option.id);
              }}
            >
              {t.rich("forecastCopyFromRich", {
                label: (element) => (
                  <span className="opacity-50">{element}</span>
                ),
                title: targetOption.name,
              })}
            </button>
          ),
        }));
    } else {
      return [];
    }
  }, [menuMode, options, option.id, t, handleCopyToAll, handleCopy]);

  return (
    <DropdownMenu
      items={menuItems}
      textAlign="right"
      onClose={() => setMenuMode("main")}
      className="text-blue-800 dark:text-blue-800-dark"
    >
      <Button
        className="size-[26px] border border-blue-400 dark:border-blue-400-dark"
        variant="link"
      >
        <FontAwesomeIcon
          className="text-blue-700 dark:text-blue-700-dark"
          icon={faCopy}
        />
      </Button>
    </DropdownMenu>
  );
};

export default ForecastMakerGroupCopyMenu;
