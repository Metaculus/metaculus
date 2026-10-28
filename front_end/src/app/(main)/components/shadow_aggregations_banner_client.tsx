"use client";

import { FC, useState } from "react";

import Checkbox from "@/components/ui/checkbox";
import { SHADOW_AGGREGATIONS_COOKIE } from "@/constants/questions";
import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";
import { safeDocumentCookie } from "@/utils/core/storage";

// Hardcoded: a temporary, staff-only control
const LABEL = "View reputation weighted aggregate (staff only)";

export const ShadowAggregationsBannerClient: FC<{ enabled: boolean }> = ({
  enabled,
}) => {
  const { user } = useAuth();
  const [checked, setChecked] = useState(enabled);

  if (!user?.is_staff) return null;

  const handleChange = (value: boolean) => {
    setChecked(value);
    // A session cookie, so it lasts while navigating but not across sessions
    safeDocumentCookie.set(
      SHADOW_AGGREGATIONS_COOKIE,
      value ? "true" : "false"
    );
    // A full reload, so client-side caches (feeds, prediction flow) refetch too
    window.location.reload();
  };

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b px-2 py-1 text-xs leading-5",
        checked
          ? "border-purple-900 bg-purple-800 text-gray-0 dark:border-purple-900-dark dark:bg-purple-800-dark dark:text-gray-0-dark"
          : "border-purple-400 bg-purple-200 text-purple-900 dark:border-purple-400-dark dark:bg-purple-200-dark dark:text-purple-900-dark"
      )}
    >
      <Checkbox
        checked={checked}
        onChange={handleChange}
        label={LABEL}
        className="font-medium"
      >
        {/* The label sets its own color, which washes out on the "on" banner */}
        <span className={cn(checked && "text-gray-0 dark:text-gray-0-dark")}>
          {LABEL}
        </span>
      </Checkbox>
    </div>
  );
};
