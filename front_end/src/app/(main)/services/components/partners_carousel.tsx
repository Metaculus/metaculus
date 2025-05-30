"use client";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";

import useAppTheme from "@/hooks/use_app_theme";

import * as AsteraDark from "../assets/astera-logo-dark.svg";
import * as AsteraLight from "../assets/astera-logo.svg";
import * as ClearerThinDark from "../assets/clearer-thinking-logo-dark.svg";
import * as ClearerThinLight from "../assets/clearer-thinking-logo.svg";
import * as ConvergenceDark from "../assets/convergence-logo-dark.svg";
import * as ConvergenceLight from "../assets/convergence-logo.svg";
import * as FasDark from "../assets/fas-logo-dark.svg";
import * as FasLight from "../assets/fas-logo.svg";
import * as GivewellDark from "../assets/givewell-logo-dark.svg";
import * as GivewellLight from "../assets/givewell-logo.svg";
import "./styles.scss";

const LOGOS = {
  light: [
    AsteraDark,
    ClearerThinLight,
    ConvergenceLight,
    FasLight,
    GivewellLight,
  ],
  dark: [AsteraLight, ClearerThinDark, ConvergenceDark, FasDark, GivewellDark],
};

const PartnersCarousel = () => {
  const { theme } = useAppTheme();
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      containScroll: "trimSnaps",
    },
    [AutoScroll({ speed: 1, stopOnInteraction: false })]
  );

  return (
    <div className="relative mx-auto my-10 w-full max-w-[1044px] px-0 py-10">
      <div className="h-[50px] overflow-hidden" ref={emblaRef}>
        <div className="flex h-full w-full">
          {theme &&
            LOGOS[theme].map((logo, index) => (
              <div className="w-auto min-w-0 flex-[0_0_35%]" key={index}>
                <Image
                  src={logo}
                  alt="logo"
                  className="h-full w-auto pr-[50px]"
                />
              </div>
            ))}
        </div>
      </div>
      {/* left fading */}
      <div className="absolute left-0 top-0 h-full w-[150px] bg-gradient-to-r from-gray-0 to-transparent dark:from-blue-50-dark" />
      {/* right fading */}
      <div className="absolute right-0 top-0 h-full w-[150px] bg-gradient-to-l from-gray-0 to-transparent dark:from-blue-50-dark" />
    </div>
  );
};

export default PartnersCarousel;
