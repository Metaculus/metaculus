import Image from "next/image";
import { CSSProperties, FC } from "react";

import cn from "@/utils/core/cn";

import { resolveAssetSource } from "../helpers/assets";
import { getReadableForeground } from "../helpers/contrast";
import { Initiative } from "../types";

type Props = {
  initiative: Initiative;
  name: string;
  className?: string;
};

const InitiativeMark: FC<Props> = ({ initiative, name, className }) => {
  const { logo, brand } = initiative;
  const logoSource = logo ? resolveAssetSource(logo) : null;

  return (
    <span
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[22%] bg-[var(--initiative-brand)] @container dark:bg-[var(--initiative-brand-dark)]",
        className
      )}
      style={
        {
          "--initiative-brand": brand.color,
          "--initiative-brand-dark": brand.darkColor ?? brand.color,
          "--initiative-mark-foreground": getReadableForeground(brand.color),
        } as CSSProperties
      }
    >
      {logoSource ? (
        <Image
          src={logoSource.src}
          unoptimized={logoSource.unoptimized}
          alt=""
          fill
          sizes="200px"
          className="object-contain p-[30%]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-[40cqw] font-semibold leading-none text-[var(--initiative-mark-foreground)]"
        >
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
};

export default InitiativeMark;
