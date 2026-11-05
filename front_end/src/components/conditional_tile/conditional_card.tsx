import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import { Href } from "@/types/navigation";
import cn from "@/utils/core/cn";

type Props = {
  title: string;
  label?: string;
  resolved?: boolean;
  href?: Href;
  compact?: boolean;
};

const ConditionalCard: FC<PropsWithChildren<Props>> = ({
  title,
  label,
  resolved,
  href,
  compact,
  children,
}) => {
  const CardContent = (
    <div
      className={cn(
        "ConditionalSummary-card flex min-h-20 flex-col gap-2 border p-3",
        compact && "min-h-0 gap-1 px-3 py-2.5",
        resolved
          ? "border-purple-800 dark:border-purple-800"
          : "border-blue-500 dark:border-blue-500-dark"
      )}
    >
      {!!label && (
        <span className="ConditionalSummary-card-label text-xs font-semibold uppercase text-blue-700 dark:text-blue-700">
          {label}
        </span>
      )}
      <h4
        className={cn(
          "ConditionalSummary-card-heading m-0",
          compact && "text-sm font-medium"
        )}
      >
        {title}
      </h4>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} prefetch={false} className="no-underline">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};

export default ConditionalCard;
