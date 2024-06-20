"use client";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  FC,
  useCallback,
  useRef,
  useState,
  UIEvent,
  PropsWithChildren,
  ReactNode,
} from "react";

import Button from "@/components/ui/button";

type Props = {
  className?: string;
  FooterComponent?: ReactNode;
};

const Carousel: FC<PropsWithChildren<Props>> = ({
  className,
  FooterComponent,
  children,
}) => {
  const [prevButtonDisabled, setPrevButtonDisabled] = useState(true);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

  const forecastsRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (isScrolledLeft(event.currentTarget) && !prevButtonDisabled) {
        setPrevButtonDisabled(true);
      }
      if (!isScrolledLeft(event.currentTarget) && prevButtonDisabled) {
        setPrevButtonDisabled(false);
      }
      if (isScrolledRight(event.currentTarget) && !nextButtonDisabled) {
        setNextButtonDisabled(true);
      }
      if (!isScrolledRight(event.currentTarget) && nextButtonDisabled) {
        setNextButtonDisabled(false);
      }
    },
    [prevButtonDisabled, nextButtonDisabled]
  );

  const goPrevious = () => {
    const element = forecastsRef.current;
    if (!element) return;
    element.scrollLeft = element.scrollLeft - element.children[1].clientWidth;
  };
  const goNext = () => {
    const element = forecastsRef.current;
    if (!element) return;
    element.scrollLeft = element.scrollLeft + element.children[1].clientWidth;
  };

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute -left-8 top-0 z-10 block h-full bg-gradient-to-r from-inherit xs:w-8" />
        <div
          className="relative -mx-5 flex snap-x snap-mandatory flex-nowrap overflow-auto scroll-smooth no-scrollbar xs:mx-0 xs:-ml-8"
          onScroll={handleScroll}
          ref={forecastsRef}
        >
          <div className="min-w-[2000px]" />
          {children}
          <div className="min-w-[2000px]" />
        </div>
        <div className="absolute right-0 top-0 z-10 block h-full bg-gradient-to-l from-inherit to-transparent xs:w-12" />
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="tertiary"
          size="lg"
          aria-label="Scroll forecasts left"
          onClick={goPrevious}
          disabled={prevButtonDisabled}
          presentationType="icon"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </Button>
        <Button
          variant="tertiary"
          size="lg"
          aria-label="Scroll forecasts right"
          onClick={goNext}
          disabled={nextButtonDisabled}
          presentationType="icon"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </Button>
        {FooterComponent}
      </div>
    </div>
  );
};

export const CarouselItem: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex flex-[1_0_100%] snap-start xs:flex-[1_0_470px]">
    <div className="mx-1 my-4 w-full xs:ml-8 xs:mr-0 ">{children}</div>
  </div>
);

const isScrolledLeft = (container: HTMLDivElement) =>
  container.children[1] instanceof HTMLElement &&
  container.scrollLeft <= container.children[1].offsetLeft;

const isScrolledRight = (container: HTMLDivElement) =>
  container.lastChild instanceof HTMLElement &&
  container.parentElement &&
  container.parentElement.lastElementChild &&
  container.scrollLeft >=
    container.lastChild.offsetLeft -
      container.clientWidth +
      parseFloat(
        window.getComputedStyle(container.parentElement.lastElementChild).width
      );

export default Carousel;
