"use client";

import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useCallback, useEffect } from "react";

export type TournamentNavItem = {
  title: string;
  href: string;
};

export type TournamentPagerProps = {
  items: TournamentNavItem[];
  currentIndex?: number;
  className?: string;
  dotsAriaLabel?: string;
};

const TournamentPager: React.FC<TournamentPagerProps> = ({
  items,
  currentIndex,
  className,
  dotsAriaLabel = "Tournament pages",
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const index = useMemo(() => {
    if (typeof currentIndex === "number")
      return Math.min(Math.max(currentIndex, 0), items.length - 1);
    const p = pathname?.replace(/\/$/, "") ?? "";
    const found = items.findIndex(
      (it) =>
        p === it.href.replace(/\/$/, "") ||
        p.startsWith(it.href.replace(/\/$/, ""))
    );
    return found >= 0 ? found : 0;
  }, [currentIndex, items, pathname]);

  const prev = index > 0 ? items[index - 1] : undefined;
  const next = index < items.length - 1 ? items[index + 1] : undefined;
  const current = items[index];

  const firstHref = items[0]?.href;
  const lastHref = items[items.length - 1]?.href;

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) {
        e.preventDefault();
        router.push(prev.href);
      } else if (e.key === "ArrowRight" && next) {
        e.preventDefault();
        router.push(next.href);
      } else if (e.key === "Home" && firstHref) {
        e.preventDefault();
        router.push(firstHref);
      } else if (e.key === "End" && lastHref) {
        e.preventDefault();
        router.push(lastHref);
      }
    },
    [firstHref, lastHref, next, prev, router]
  );

  const Arrow = ({
    disabled,
    href,
    label,
    icon,
  }: {
    disabled: boolean;
    href: string;
    label: string;
    icon: typeof faArrowLeft;
  }) => {
    const base = clsx(
      "inline-flex items-center justify-center",
      "h-6 w-6 md:h-8 md:w-8 rounded-lg",
      disabled
        ? "text-purple-700/20 dark:text-purple-700-dark/20 cursor-not-allowed"
        : "text-purple-700 hover:text-purple-800 dark:text-purple-700-dark dark:hover:text-purple-800-dark"
    );

    if (disabled) {
      return (
        <span
          aria-disabled="true"
          aria-label={`${label} (disabled)`}
          tabIndex={-1}
          className={clsx(base, "pointer-events-none")}
        >
          <FontAwesomeIcon icon={icon} className="h-6 w-6 md:h-8 md:w-8" />
        </span>
      );
    }

    return (
      <Link href={href} aria-label={label} className={clsx("group", base)}>
        <FontAwesomeIcon icon={icon} className="h-6 w-6 md:h-8 md:w-8" />
      </Link>
    );
  };

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  if (!items || items.length === 0) return null;

  return (
    <div className={clsx("w-full", className)}>
      <nav
        aria-label="Tournament pager"
        className={clsx(
          "flex w-full items-center justify-between rounded-[6px]",
          "bg-purple-200 dark:bg-purple-200-dark",
          "p-3 md:p-4",
          "mb-4 h-14 md:h-16"
        )}
      >
        <Arrow
          disabled={!prev}
          href={prev?.href ?? "#"}
          label={prev ? `Go to ${prev.title}` : "No previous page"}
          icon={faArrowLeft}
        />

        <div className="flex min-w-0 flex-col items-center gap-0.5 text-center md:gap-1">
          <div
            className={clsx(
              "truncate font-medium leading-[28px] md:leading-[32px]",
              "text-purple-900/90 dark:text-purple-900-dark/90",
              "text-[20px] md:text-2xl"
            )}
          >
            {current?.title}
          </div>
          <div className="flex items-center gap-0.5" aria-label={dotsAriaLabel}>
            {items.map((it, i) => {
              const isActive = i === index;
              return (
                <Link
                  href={it.href}
                  key={it.href + i}
                  aria-current={isActive ? "page" : undefined}
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full transition-opacity",
                    isActive ? "opacity-100" : "opacity-20 hover:opacity-70",
                    "bg-purple-700 dark:bg-purple-700-dark"
                  )}
                />
              );
            })}
          </div>
        </div>

        <Arrow
          disabled={!next}
          href={next?.href ?? "#"}
          label={next ? `Go to ${next.title}` : "No next page"}
          icon={faArrowRight}
        />
      </nav>
    </div>
  );
};

export const TOURNAMENT_ITEMS = [
  { title: "Q3 2024", href: "/aib/2024/q3" },
  { title: "Q4 2024", href: "/aib/2024/q4" },
  { title: "Q1 2025", href: "/aib/2025/q1" },
  { title: "Q2 2025", href: "/aib/2025/q2" },
  { title: "Fall 2025", href: "/aib/2025/fall" },
].reverse();

export default TournamentPager;
