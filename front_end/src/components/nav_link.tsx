"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, FC } from "react";

import cn from "@/utils/core/cn";
import { isPathEqual } from "@/utils/navigation";

type LinkProps = ComponentProps<typeof Link> & {
  href: string;
  activeClassName?: string;
};

const NavLink: FC<LinkProps> = ({
  children,
  href,
  activeClassName = "active",
  ...props
}) => {
  const pathname = usePathname();
  const isActive = isPathEqual(pathname, href);

  return (
    <Link
      {...props}
      href={href}
      className={cn("group relative", props.className, {
        [activeClassName]: isActive,
      })}
    >
      <span>{children}</span>
      <span className="absolute bottom-0 left-0 h-1 w-full bg-blue-600 opacity-0 transition-opacity group-[.active]:opacity-100" />
    </Link>
  );
};

export default NavLink;
