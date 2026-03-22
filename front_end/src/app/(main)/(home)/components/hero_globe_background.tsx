"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

const DitheringShader = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => {
      const { Dithering } = mod;
      const Wrapper: FC = () => (
        <Dithering
          shape="sphere"
          type="4x4"
          colorBack="#283c52"
          colorFront="#628bb3"
          speed={0.4}
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

const HeroGlobeBackground: FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-60">
      <div className="absolute -top-[20%] h-[130%] w-[130%]">
        <DitheringShader />
      </div>
    </div>
  );
};

export default HeroGlobeBackground;
