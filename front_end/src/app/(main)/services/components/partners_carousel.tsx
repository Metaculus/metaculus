"use client";
import AutoScroll from "embla-carousel-auto-scroll";
import useEmblaCarousel from "embla-carousel-react";
import { FC } from "react";

import cn from "@/utils/core/cn";

import ClientImage from "./client_image";
import ServiceConfig from "../serviceConfig";

type Props = {
  className?: string;
};

const PartnersCarousel: FC<Props> = ({ className }) => {
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

  // Duplicate logos to always have the infinite scrolling effect
  const carouselLogos =
    partnersLogos.length < 5
      ? [...partnersLogos, ...partnersLogos]
      : partnersLogos;
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1044px] px-0 py-5",
        className
      )}
    >
      <div className="h-[50px] overflow-hidden" ref={emblaRef}>
        <div className="flex h-full w-full">
          {carouselLogos.map((logo, index) => (
            <div key={index} className="flex h-full flex-none items-center">
              {logo.href ? (
                <a
                  href={logo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <ClientImage
                    lightSrc={logo.light}
                    darkSrc={logo.dark}
                    alt="logo"
                    height={Number(logo.height)}
                    width={50}
                    className="w-auto pr-[50px]"
                    style={{ height: `${logo.height}px` }}
                  />
                </a>
              ) : (
                <ClientImage
                  lightSrc={logo.light}
                  darkSrc={logo.dark}
                  alt="logo"
                  height={Number(logo.height)}
                  width={50}
                  className="w-auto pr-[50px]"
                  style={{ height: `${logo.height}px` }}
                />
              )}
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
