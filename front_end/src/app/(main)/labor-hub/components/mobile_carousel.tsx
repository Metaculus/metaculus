"use client";

import useEmblaCarousel from "embla-carousel-react";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import cn from "@/utils/core/cn";

type Props = {
  children: ReactNode;
  className?: string;
};

export function MobileCarousel({ children, className }: Props) {
  const slides = React.Children.toArray(children);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const emblaOptions = useMemo(
    () => ({
      align: "center" as const,
      containScroll: "trimSnaps" as const,
    }),
    []
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <div className={cn("", className)}>
      <div ref={emblaRef} className="-my-4 overflow-hidden px-5 py-4 md:px-10">
        <div className="-ml-3 flex">
          {slides.map((slide, i) => (
            <div key={i} className="min-w-0 flex-[0_0_85%] pl-3">
              {slide}
            </div>
          ))}
        </div>
      </div>
      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "size-2 rounded-full transition-colors",
                i === selectedIndex
                  ? "bg-blue-700 dark:bg-blue-700-dark"
                  : "bg-gray-400 dark:bg-gray-400-dark"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
