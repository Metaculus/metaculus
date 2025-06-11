"use client";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

import ServiceConfig from "../serviceConfig.json";

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
  const { partnersLogos } = ServiceConfig;
  const duplicatedLogos = theme
    ? [...partnersLogos[theme], ...partnersLogos[theme]]
    : [];
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
                height={Number(logo.height)}
                width={50}
                className="w-auto pr-[50px]"
                style={{ height: `${logo.height}px` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute left-0 top-0 h-full w-[150px] bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-50-dark" />
      <div className="absolute right-0 top-0 h-full w-[150px] bg-gradient-to-l from-blue-200 to-transparent dark:from-blue-50-dark" />
    </div>
  );
};

export default PartnersCarousel;
