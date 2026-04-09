import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import ImageWithFallback from "@/components/ui/image_with_fallback";
import cn from "@/utils/core/cn";

export function ActivityCard({
  avatar,
  date,
  username,
  subtitle,
  children,
  degradeIndex = 0,
  variant = "purple",
  link,
}: {
  avatar?: string;
  date?: string;
  username?: string;
  subtitle?: string;
  children: React.ReactNode;
  degradeIndex?: number;
  variant?: "purple" | "mint";
  link?: string;
}) {
  return (
    <div
      style={{ "--degrade-index": degradeIndex } as React.CSSProperties}
      className={cn(
        variant === "purple" &&
          "border-purple-400 bg-purple-200 dark:border-purple-200-dark dark:bg-purple-100-dark",
        variant === "mint" &&
          "border-mint-500 bg-mint-200 dark:border-mint-300-dark dark:bg-mint-200-dark",
        link && "pr-12",
        "relative break-inside-avoid rounded-lg border px-3.5 py-3 [--tw-bg-opacity:max(0.2,1-var(--degrade-index)*0.2)] dark:[--tw-bg-opacity:max(0.2,1-var(--degrade-index)*0.2)]"
      )}
    >
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          aria-label="Open external link"
          className={cn(
            variant === "purple" &&
              "text-purple-700 hover:text-purple-800 dark:text-purple-700-dark dark:hover:text-purple-800-dark",
            variant === "mint" &&
              "text-mint-700 hover:text-mint-800 dark:text-mint-700-dark dark:hover:text-mint-800-dark",
            "absolute right-3.5 top-3 inline-flex size-5 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
          )}
        >
          <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="size-4" />
        </a>
      )}
      {(avatar || username || subtitle || date) && (
        <div className="mb-1 flex items-center gap-3">
          {avatar && (
            <div className="mt-0.5 size-10 shrink-0 overflow-hidden rounded-full">
              <ImageWithFallback
                src={avatar}
                alt={username ? `${username} avatar` : ""}
                width={40}
                height={40}
                className="size-full object-cover"
              />
            </div>
          )}
          {(username || subtitle || date) && (
            <div
              className={cn(
                variant === "purple" &&
                  "text-purple-700 dark:text-purple-700-dark",
                variant === "mint" && "text-mint-700 dark:text-mint-700-dark",
                "flex min-w-0 flex-1 items-start justify-between gap-2 text-xs"
              )}
            >
              <div className="min-w-0">
                {username && <div className="font-bold">{username}</div>}
                {subtitle && (
                  <div className="font-medium opacity-80">{subtitle}</div>
                )}
              </div>
              {date && <div className="shrink-0 font-medium">{date}</div>}
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          variant === "purple" && "text-purple-800 dark:text-purple-800-dark",
          variant === "mint" && "text-mint-800 dark:text-mint-800-dark",
          "text-sm leading-normal lg:text-base"
        )}
      >
        {children}
      </div>
    </div>
  );
}
