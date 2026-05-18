"use client";

import { usePathname } from "next/navigation";

import { usePublicSettings } from "@/contexts/public_settings_context";

export function PrintAttribution() {
  const pathname = usePathname();
  const { PUBLIC_APP_URL } = usePublicSettings();
  const url = new URL(pathname, PUBLIC_APP_URL);

  return (
    <div className="hidden print:block print:py-6 print:text-center print:text-sm print:text-gray-700">
      {url.host}
      {url.pathname} —{" "}
      {new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </div>
  );
}
