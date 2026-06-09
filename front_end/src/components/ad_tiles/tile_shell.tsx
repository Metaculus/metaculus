import Image from "next/image";
import Link from "next/link";
import { ComponentProps, FC, ReactNode } from "react";

type Props = {
  href: string;
  image?: string | null;
  onDismiss?: () => void;
  onClick?: ComponentProps<typeof Link>["onClick"];
  children: ReactNode;
};

const TileShell: FC<Props> = ({
  href,
  image,
  onDismiss,
  onClick,
  children,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group relative flex flex-col gap-3 overflow-hidden rounded border border-transparent px-6 py-5 text-gray-0 no-underline transition-colors hover:border-gray-0/70"
    >
      {image ? (
        <>
          <div className="absolute inset-0 bg-black" />
          <Image
            src={image}
            alt=""
            fill
            className="size-full object-cover object-center"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
        </>
      ) : (
        <div className="absolute inset-0 bg-blue-700" />
      )}

      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded text-gray-0/60 transition-colors hover:text-gray-0"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}

      {children}
    </Link>
  );
};

export default TileShell;
