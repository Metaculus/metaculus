import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { QuestionStatus } from "@/types/post";
import cn from "@/utils/core/cn";

import { ContinuousGroupOption } from "../continuous_group_accordion/group_forecast_accordion";

type Props = {
  option: ContinuousGroupOption;
  options: ContinuousGroupOption[];
  copyFromOptions?: ContinuousGroupOption[];
  handleCopy: (fromOptionId: number, toOptionId: number) => void;
  setForcedOpenId: (optionId: number) => void;
};

const ForecastMakerGroupCopyMenu: FC<Props> = ({
  option,
  options,
  copyFromOptions,
  handleCopy,
  setForcedOpenId,
}) => {
  const t = useTranslations();

  const handleCopyToAll = useCallback(() => {
    options.forEach((toOption) => {
      if (toOption.id !== option.id) {
        handleCopy(option.id, toOption.id);
      }
    });
    toast(t("forecastCopyToAllToastMessage"));
  }, [options, t, option.id, handleCopy]);

  const handleCopyTo = useCallback(
    (targetOption: ContinuousGroupOption) => {
      handleCopy(option.id, targetOption.id);

      toast(
        t.rich("forecastCopyToToastMessage", {
          from_name: option.name,
          to_name: targetOption.name,
        })
      );

      setForcedOpenId(targetOption.id);

      setTimeout(() => {
        document
          .getElementById(`group-option-${targetOption.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    },
    [handleCopy, option.id, option.name, t, setForcedOpenId]
  );

  const handleCopyFrom = useCallback(
    (targetOption: ContinuousGroupOption) => {
      handleCopy(targetOption.id, option.id);
      toast(
        t.rich("forecastCopyFromToastMessage", {
          name: targetOption.name,
        })
      );
    },
    [handleCopy, option.id, t]
  );

  const [menuMode, setMenuMode] = useState<"main" | "copyTo" | "copyFrom">(
    "main"
  );

  const canCopyFrom =
    option.hasUserForecast || option.wasWithdrawn;

  const menuItems: MenuItemProps[] = useMemo(() => {
    if (menuMode === "main") {
      return [
        {
          id: "forecastCopyToAll",
          name: t("forecastCopyToAll"),
          ...(canCopyFrom
            ? { onClick: handleCopyToAll }
            : {
                element: (
                  <button
                    className="w-full cursor-not-allowed self-stretch whitespace-nowrap p-2 text-right opacity-50"
                    disabled
                  >
                    {t("forecastCopyToAll")}
                  </button>
                ),
              }),
        },
        {
          id: "forecastCopyTo",
          name: t("forecastCopyTo"),
          ...(canCopyFrom
            ? {
                onClick: (e: React.MouseEvent<HTMLElement>) => {
                  e.preventDefault();
                  setMenuMode("copyTo");
                },
              }
            : {
                element: (
                  <button
                    className="w-full cursor-not-allowed self-stretch whitespace-nowrap p-2 text-right opacity-50"
                    disabled
                  >
                    {t("forecastCopyTo")}
                  </button>
                ),
              }),
        },
        {
          id: "forecastCopyFrom",
          name: t("forecastCopyFrom"),
          onClick: (e: React.MouseEvent<HTMLElement>) => {
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
              onClick={() => handleCopyTo(targetOption)}
            >
              {t.rich("forecastCopyToRich", {
                label: (element) => (
                  <span className="opacity-50">{element}</span>
                ),
                name: targetOption.name,
              })}
            </button>
          ),
        }));
    } else if (menuMode === "copyFrom") {
      return (copyFromOptions ?? options)
        .filter((o) => o.id !== option.id)
        .map((targetOption) => {
          const isDisabled =
            targetOption.question.status === QuestionStatus.CLOSED ||
            targetOption.question.status === QuestionStatus.RESOLVED;
          return {
            id: `copyFrom${targetOption.id}`,
            element: (
              <button
                className={cn(
                  "w-full self-stretch whitespace-nowrap p-2 text-right",
                  isDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-200 hover:dark:bg-gray-200-dark"
                )}
                onClick={
                  isDisabled ? undefined : () => handleCopyFrom(targetOption)
                }
                disabled={isDisabled}
              >
                {t.rich("forecastCopyFromRich", {
                  label: (element) => (
                    <span className="opacity-50">{element}</span>
                  ),
                  name: targetOption.name,
                })}
              </button>
            ),
          };
        });
    } else {
      return [];
    }
  }, [
    menuMode,
    t,
    canCopyFrom,
    handleCopyToAll,
    options,
    copyFromOptions,
    option.id,
    handleCopyTo,
    handleCopyFrom,
  ]);

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
