"use client";

import dynamic from "next/dynamic";
import { FC, useEffect, useState } from "react";

type DitheringProps = {
  colorFront: string;
  speed: number;
};

const DitheringShader = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => {
      const { Dithering } = mod;
      const Wrapper: FC<DitheringProps> = ({ colorFront, speed }) => (
        <Dithering
          shape="sphere"
          type="4x4"
          colorBack="#283c52"
          colorFront={colorFront}
          speed={speed}
          size={3}
          scale={1.2}
          style={{ width: "100%", height: "100%" }}
        />
      );
      Wrapper.displayName = "DitheringWrapper";
      return Wrapper;
    }),
  { ssr: false }
);

type Props = {
  colorFront?: string;
  speed?: number;
};

const HeroGlobeBackground: FC<Props> = ({
  colorFront = "#628bb3",
  speed = 0.4,
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60">
      <div className="absolute -top-[20%] h-[130%] w-[130%]">
        {reducedMotion ? (
          <div
            className="size-full rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${colorFront}, #283c52)`,
              transition: "background 0.5s ease",
            }}
          />
        ) : (
          <DitheringShader colorFront={colorFront} speed={speed} />
        )}
      </div>
    </div>
  );
};

export default HeroGlobeBackground;
