"use client";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { useShareMenuItems } from "@/hooks/use_share_menu_items";
import cn from "@/utils/core/cn";

type Props = {
  questionTitle: string;
  questionId?: number;
  btnClassName?: string;
};

export const SharePostMenu: FC<Props> = ({
  questionTitle,
  questionId,
  btnClassName,
}) => {
  const shareMenuItems = useShareMenuItems({
    questionTitle,
    questionId,
    includeEmbedOnSmallScreens: true,
  });

  return (
    <DropdownMenu items={shareMenuItems}>
      <Button
        variant="secondary"
        className={cn("rounded border-0", btnClassName)}
        presentationType="icon"
      >
        <FontAwesomeIcon icon={faShareNodes} className="text-lg" />
      </Button>
    </DropdownMenu>
  );
};
