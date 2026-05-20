"use client";

import { ReactNode } from "react";

import { MobileCarousel } from "@/app/(main)/labor-hub/components/mobile_carousel";

type Props = {
  exposure: ReactNode;
  insights: ReactNode;
  wagesHours: ReactNode;
};

export function BentoLayout({ exposure, insights, wagesHours }: Props) {
  return (
    <>
      {/* Mobile: 3-step swipe carousel */}
      <div className="md:hidden">
        <MobileCarousel>
          <div>{exposure}</div>
          <div>{insights}</div>
          <div>{wagesHours}</div>
        </MobileCarousel>
      </div>
      {/* Tablet & desktop: bento grid */}
      <div className="hidden md:block">
        {exposure}
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">{insights}</div>
          <div className="md:col-span-1">{wagesHours}</div>
        </div>
      </div>
    </>
  );
}
