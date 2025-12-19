import { FC } from "react";

import NavLink from "@/components/nav_link";
import cn from "@/utils/core/cn";

type Props = {
  links: Array<{ label: string; href: string }>;
  className?: string;
};

const NavbarLinks: FC<Props> = ({ links, className }) => {
  return (
    <ul
      className={cn(
        "flex flex-auto list-none items-stretch p-0 text-sm font-medium",
        className
      )}
    >
      {links.map((link) => (
        <li key={link.href} className="z-10">
          <NavLink
            href={link.href}
            className="flex h-full items-center p-3 no-underline hover:bg-blue-700"
          >
            {link.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
};

export default NavbarLinks;
