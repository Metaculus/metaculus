"use client";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import useMounted from "@/hooks/use_mounted";
import { AppTheme } from "@/types/theme";
import cn from "@/utils/core/cn";

const ThemeToggle: FC<{ className?: string }> = ({ className }) => {
  const mounted = useMounted();

  const { theme, isSyncing, setTheme } = useAppTheme();
  const switchTheme = () => {
    if (theme === "dark") {
      setTheme(AppTheme.Light);
    } else {
      setTheme(AppTheme.Dark);
    }
  };

  // avoid hydration mismatch
  // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#avoid-hydration-mismatch
  if (!mounted) {
    return <div className="w-8 min-w-[2rem]" />;
  }

  return (
    <button
      className={cn(
        "group/theme relative inline-block h-[15px] w-[35px] min-w-[2rem] rounded-full border border-white focus:outline-none",
        className
      )}
      onClick={switchTheme}
      // Optimistic update
      // But don't allow to click until values is synced with backend
      disabled={isSyncing}
    >
      <span
        className={cn(
          "absolute right-[-1px] top-[-1px] flex h-[15px] w-5 items-center justify-center rounded-full border border-white outline-1 transition duration-200 group-focus-visible/theme:outline group-focus-visible/theme:outline-1 group-focus-visible/theme:outline-white",
          {
            "-translate-x-[15px]": theme === "light",
          }
        )}
      >
        {theme === "light" ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
};

const SunIcon: FC = () => (
  <svg
    width="10"
    height="10"
    viewBox="-6 -6 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="0" cy="0" r="3" fill="currentColor" stroke="none" />
    <path
      d="M0,6V-6M6,0H-6M4.2,4.2L-4.2,-4.2M4.2,-4.2L-4.2,4.2"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
    />
  </svg>
);

const MoonIcon: FC = () => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.16816 0.51887C3.21214 0.56897 3.23908 0.630283 3.24551 0.694887C3.25193 0.759491 3.23755 0.824418 3.20421 0.881276C2.94373 1.32963 2.80771 1.83219 2.80864 2.34273C2.80864 4.04114 4.28549 5.41642 6.10564 5.41642C6.34307 5.41642 6.57419 5.39319 6.79631 5.34884C6.86439 5.33502 6.93532 5.34031 7.00022 5.36404C7.06512 5.38778 7.12112 5.42892 7.16124 5.48232C7.20358 5.53784 7.22517 5.60492 7.22265 5.67314C7.22012 5.74135 7.19362 5.80687 7.14727 5.85951C6.79391 6.26645 6.34814 6.59433 5.84245 6.81924C5.33677 7.04416 4.78392 7.16044 4.22421 7.15961C2.14726 7.15961 0.464966 5.59087 0.464966 3.65804C0.464966 2.20334 1.41739 0.955616 2.7735 0.42679C2.84105 0.400024 2.91604 0.394531 2.98721 0.411135C3.05837 0.427739 3.12187 0.465543 3.16816 0.51887Z"
      fill="currentColor"
    />
  </svg>
);

export default ThemeToggle;
