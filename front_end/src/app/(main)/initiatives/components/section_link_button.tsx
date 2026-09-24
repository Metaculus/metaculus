"use client";

import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, MouseEvent, ReactNode } from "react";

import Button, { ButtonVariant } from "@/components/ui/button";

import { scrollToAnchor } from "../helpers/anchors";

type Props = {
  href: string;
  variant: ButtonVariant;
  className?: string;
  children: ReactNode;
};

const SectionLinkButton: FC<Props> = ({
  href,
  variant,
  className,
  children,
}) => {
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (scrollToAnchor(href.slice(1))) event.preventDefault();
  };

  return (
    <Button
      href={href}
      variant={variant}
      size="md"
      onClick={handleClick}
      className={className}
    >
      {children}
      <FontAwesomeIcon
        icon={faArrowDown}
        aria-hidden="true"
        className="size-3"
      />
    </Button>
  );
};

export default SectionLinkButton;
