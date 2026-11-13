"use client";

import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { WORLD_BY_YEAR_THEME_CLASSNAME } from "./theme";
import { useWorldYear } from "./world_year_provider";

export default function YearToast() {
  const t = useTranslations();
  const { year, scrubbing, pendingSource } = useWorldYear();
  const visible = scrubbing && pendingSource !== "hero";

  return (
    <div
      role="status"
      aria-hidden={!visible}
      className={cn(
        WORLD_BY_YEAR_THEME_CLASSNAME,
        "pointer-events-none fixed left-1/2 top-[calc(var(--top-chrome-height,3rem)+78px)] z-[45] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[var(--wby-fg)] py-2 pl-3 pr-3.5 font-sans text-[13px] font-medium leading-[1.2] text-[var(--wby-bg)] shadow-[0_10px_30px_rgba(0,0,0,.22)] [transition:opacity_.18s_ease,transform_.18s_cubic-bezier(.23,1,.32,1)] max-[720px]:top-[calc(var(--top-chrome-height,3rem)+66px)]",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full border-2 border-current border-r-transparent",
          visible &&
            "animate-[spin_.8s_linear_infinite] motion-reduce:animate-none"
        )}
      />
      <span>
        {t.rich(
          pendingSource === "key"
            ? "worldByYearToastShowing"
            : "worldByYearToastRelease",
          {
            year: String(year),
            b: (chunks) => (
              <b className="font-semibold tabular-nums">{chunks}</b>
            ),
          }
        )}
      </span>
    </div>
  );
}
