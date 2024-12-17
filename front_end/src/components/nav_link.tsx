"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, FC } from "react";

import cn from "@/utils/cn";

type LinkProps = ComponentProps<typeof Link> & {
  href: string;
  activeClassName: string;
};

const NavLink: FC<LinkProps> = ({
  children,
  href,
  activeClassName,
  ...props
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      {...props}
      href={href}
      className={cn(props.className, { [activeClassName]: isActive })}
    >
      {children}
    </Link>
  );
};

export default NavLink;
