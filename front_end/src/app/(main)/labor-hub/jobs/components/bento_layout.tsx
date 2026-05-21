import { ReactNode } from "react";

type Props = {
  exposure: ReactNode;
  insights: ReactNode;
  wagesHours: ReactNode;
};

export function BentoLayout({ exposure, insights, wagesHours }: Props) {
  return (
    <>
      {/*
        Mobile: tight bento — exposure row (3 tiles) + wage/hours row (2 tiles).
        Insights is rendered as a separate section below (in the page).
      */}
      <div className="md:hidden">
        {exposure}
        <div className="mt-2">{wagesHours}</div>
      </div>
      {/* Tablet & desktop: bento grid with insights inline */}
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
