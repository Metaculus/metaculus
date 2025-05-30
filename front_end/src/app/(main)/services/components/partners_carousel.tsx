"use client";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

import * as AsteraDark from "../assets/partners/astera-logo-dark.svg";
import * as AsteraLight from "../assets/partners/astera-logo.svg";
import * as ClearerThinDark from "../assets/partners/clearer-thinking-logo-dark.svg";
import * as ClearerThinLight from "../assets/partners/clearer-thinking-logo.svg";
import * as ConvergenceDark from "../assets/partners/convergence-logo-dark.svg";
import * as ConvergenceLight from "../assets/partners/convergence-logo.svg";
import * as FasDark from "../assets/partners/fas-logo-dark.svg";
import * as FasLight from "../assets/partners/fas-logo.svg";
import * as GivewellDark from "../assets/partners/givewell-logo-dark.svg";
import * as GivewellLight from "../assets/partners/givewell-logo.svg";
import * as LehighDark from "../assets/partners/lehigh-dark.svg";
import * as LehighLight from "../assets/partners/lehigh-light.svg";
import "./styles.scss";

const LOGOS = {
  light: [
    { logo: AsteraLight, height: 50 },
    { logo: ClearerThinLight, height: 50 },
    { logo: ConvergenceLight, height: 50 },
    { logo: FasLight, height: 30 },
    { logo: GivewellLight, height: 27 },
    { logo: LehighLight, height: 35 },
  ],
  dark: [
    { logo: AsteraDark, height: 50 },
    { logo: ClearerThinDark, height: 50 },
    { logo: ConvergenceDark, height: 50 },
    { logo: FasDark, height: 30 },
    { logo: GivewellDark, height: 27 },
    { logo: LehighDark, height: 35 },
  ],
};

type Props = {
  className?: string;
};

const PartnersCarousel: FC<Props> = ({ className }) => {
  const { theme } = useAppTheme();
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      containScroll: "trimSnaps",
      watchDrag: false,
    },
    [AutoScroll({ speed: 1, stopOnInteraction: false })]
  );
  const duplicatedLogos = theme ? [...LOGOS[theme], ...LOGOS[theme]] : [];
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1044px] px-0 py-5",
        className
      )}
    >
      <div className="h-[50px] overflow-hidden" ref={emblaRef}>
        <div className="flex h-full w-full">
          {duplicatedLogos.map((logo, index) => (
            <div key={index} className="flex h-full flex-none items-center">
              <Image
                src={logo.logo}
                alt="logo"
                className="w-auto pr-[50px]"
                style={{ height: `${logo.height}px` }}
              />
            </div>
          ))}
        </div>
      </div>
      {/* fading blocks */}
      <div className="absolute left-0 top-0 h-full w-[150px] bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-50-dark" />
      <div className="absolute right-0 top-0 h-full w-[150px] bg-gradient-to-l from-blue-200 to-transparent dark:from-blue-50-dark" />
    </div>
  );
};

export default PartnersCarousel;
