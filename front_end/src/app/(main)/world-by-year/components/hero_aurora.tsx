"use client";

import { FC, RefObject } from "react";

import AuroraCanvas from "./aurora_canvas";
import { HERO_AURORA } from "../helpers/aurora_effect";

type Props = {
  headRef: RefObject<HTMLElement | null>;
  frostRef: RefObject<HTMLElement | null>;
  holdRef: RefObject<boolean>;
};

const HeroAurora: FC<Props> = ({ headRef, frostRef, holdRef }) => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen overflow-hidden"
  >
    <AuroraCanvas
      config={HERO_AURORA}
      headRef={headRef}
      holdRef={holdRef}
      frostRef={frostRef}
      className="absolute -left-20 -top-20 h-[calc(100%+160px)] w-[calc(100%+160px)]"
    />
  </div>
);

export default HeroAurora;
