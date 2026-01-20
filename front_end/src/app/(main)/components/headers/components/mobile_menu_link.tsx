import { MenuItem } from "@headlessui/react";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import { Href } from "@/types/navigation";
import cn from "@/utils/core/cn";

const MobileMenuLink: FC<
  PropsWithChildren<{
    href?: Href;
    onClick?: () => void;
    regularLink?: boolean;
    className?: string;
  }>
> = ({ href, onClick, regularLink = false, children, className }) => {
  return (
    <MenuItem
      as={href ? (regularLink ? "a" : Link) : "button"}
      {...(href ? { href } : {})}
      onClick={onClick}
      className={cn(
        "flex h-fit w-full items-start justify-start px-4 py-1.5 text-sm capitalize no-underline hover:bg-blue-400-dark",
        className
      )}
    >
      {children}
    </MenuItem>
  );
};

export default MobileMenuLink;
