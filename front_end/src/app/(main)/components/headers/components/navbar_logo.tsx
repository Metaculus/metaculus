import Link from "next/link";
import { FC } from "react";

import { MetaculusMark } from "@/components/logos";
import { usePublicSettings } from "@/contexts/public_settings_context";
import cn from "@/utils/core/cn";

const NavbarLogo: FC<{ className?: string }> = ({ className }) => {
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  if (PUBLIC_MINIMAL_UI) {
    return null;
  }

  return (
    <Link
      href="/home/"
      className={cn(
        "inline-flex max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center bg-blue-800 text-center no-underline",
        className
      )}
    >
      <h1 className="mx-[17px] my-0">
        <span>
          <MetaculusMark className="h-[24px] w-auto text-white" />
        </span>
      </h1>
    </Link>
  );
};

export default NavbarLogo;
