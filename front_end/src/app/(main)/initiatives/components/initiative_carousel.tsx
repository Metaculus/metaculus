"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CSSProperties,
  FC,
  KeyboardEvent,
  Ref,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import cn from "@/utils/core/cn";

import InitiativeMark from "./initiative_mark";
import {
  applyDetailEmphasis,
  applyEmphasis,
  DESIGN_MARK_SIZE,
  getDetailEmphasisStyle,
  getEmphasisStyle,
} from "../helpers/emphasis";
import { usePrefersReducedMotion } from "../helpers/use_prefers_reduced_motion";
import { Initiative } from "../types";

const AUTOPLAY_INTERVAL = 5000;
const AUTOPLAY_RESUME_DELAY = 4000;
const WHEEL_STEP_THRESHOLD = 40;
const WHEEL_IDLE_RESET = 200;

const VISIBLE_ITEMS = 5;
const MIN_LOOP_SLIDES = VISIBLE_ITEMS + 1;

// A mask rather than colour overlays, so the edges fade into whatever
// background sits behind the carousel.
const EDGE_FADE =
  "linear-gradient(to right, transparent, black 2.5rem, black calc(100% - 2.5rem), transparent)";

type ActiveInitiativeLinkProps = {
  initiative: Initiative;
  name: string;
  isActive: boolean;
  initialDistance: number;
};

const ActiveInitiativeLink: FC<ActiveInitiativeLinkProps> = ({
  initiative,
  name,
  isActive,
  initialDistance,
}) => {
  const t = useTranslations();

  return (
    <Link
      href={initiative.url}
      aria-label={t("initiativesCarouselVisitInitiative", { name })}
      aria-hidden={!isActive}
      tabIndex={isActive ? undefined : -1}
      className={cn(
        "group col-start-1 row-start-1 max-w-xs justify-self-center text-center no-underline",
        !isActive && "pointer-events-none"
      )}
      style={{
        ...getDetailEmphasisStyle(initialDistance),
        opacity: "var(--initiative-detail-opacity)",
        transform: "translateX(var(--initiative-detail-shift))",
        visibility:
          "var(--initiative-detail-visibility)" as CSSProperties["visibility"],
      }}
    >
      <span className="block text-[20px] font-medium leading-[110%] tracking-[-0.01em] text-blue-900 dark:text-blue-900-dark md:text-[24px] md:tracking-[-0.015em]">
        {name}
      </span>
      {initiative.taglineKey && (
        <span className="mt-2 block text-balance text-sm font-light leading-[140%] text-blue-900 opacity-80 dark:text-blue-900-dark md:mt-3 md:text-base">
          {t(initiative.taglineKey)}{" "}
          <FontAwesomeIcon
            icon={faArrowRight}
            aria-hidden="true"
            className="h-3 w-3 align-baseline transition-transform group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transition-none"
          />
        </span>
      )}
    </Link>
  );
};

type InitiativeDetailsProps = {
  initiatives: Initiative[];
  selectedIndex: number;
  startIndex: number;
  containerRef?: Ref<HTMLDivElement>;
  className?: string;
};

const InitiativeDetails: FC<InitiativeDetailsProps> = ({
  initiatives,
  selectedIndex,
  startIndex,
  containerRef,
  className,
}) => {
  const t = useTranslations();

  return (
    <div
      ref={containerRef}
      className={cn("grid w-full grid-cols-1", className)}
    >
      {initiatives.map((initiative, index) => (
        <ActiveInitiativeLink
          key={initiative.id}
          initiative={initiative}
          name={t(initiative.nameKey)}
          isActive={index === selectedIndex}
          initialDistance={index - startIndex}
        />
      ))}
    </div>
  );
};

type Props = {
  initiatives: Initiative[];
  initialInitiativeId?: string;
};

const InitiativeCarousel: FC<Props> = ({
  initiatives,
  initialInitiativeId,
}) => {
  const t = useTranslations();
  const prefersReducedMotion = usePrefersReducedMotion();
  const requestedStartIndex = initiatives.findIndex(
    ({ id }) => id === initialInitiativeId
  );
  const startIndex =
    requestedStartIndex >= 0
      ? requestedStartIndex
      : Math.max(0, Math.floor((initiatives.length - 1) / 2));

  const slides = useMemo(() => {
    if (initiatives.length < 2) return [];

    const cycles = Math.max(1, Math.ceil(MIN_LOOP_SLIDES / initiatives.length));
    const result: {
      initiative: Initiative;
      realIndex: number;
      isRepeat: boolean;
    }[] = [];

    for (let cycle = 0; cycle < cycles; cycle++) {
      initiatives.forEach((initiative, realIndex) => {
        result.push({ initiative, realIndex, isRepeat: cycle > 0 });
      });
    }

    return result;
  }, [initiatives]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    skipSnaps: true,
    startIndex,
    watchFocus: true,
    duration: prefersReducedMotion ? 0 : 25,
  });

  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const resumeTimerRef = useRef<number | undefined>(undefined);
  const detailsRef = useRef<HTMLDivElement>(null);

  const autoplayEnabled =
    !prefersReducedMotion &&
    !isAutoplayPaused &&
    !isHovered &&
    !isFocusWithin &&
    !isPointerDown;

  const pauseAutoplay = useCallback(() => {
    window.clearTimeout(resumeTimerRef.current);
    setIsAutoplayPaused(true);
  }, []);

  const scheduleAutoplayResume = useCallback(() => {
    window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(
      () => setIsAutoplayPaused(false),
      AUTOPLAY_RESUME_DELAY
    );
  }, []);

  useEffect(() => () => window.clearTimeout(resumeTimerRef.current), []);

  useLayoutEffect(() => {
    if (!emblaApi) return;

    const update = () => {
      const viewportRect = emblaApi.rootNode().getBoundingClientRect();
      const viewportCenter = viewportRect.left + viewportRect.width / 2;
      const detailDistances = new Array<number>(initiatives.length).fill(
        Infinity
      );

      emblaApi.slideNodes().forEach((slide, index) => {
        const visual = slide.firstElementChild;
        if (!(visual instanceof HTMLElement)) return;

        const mark = visual.firstElementChild;
        const markSize =
          mark instanceof HTMLElement ? mark.offsetWidth : DESIGN_MARK_SIZE;

        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + slideRect.width / 2;
        const distance =
          (slideCenter - viewportCenter) / (slide.offsetWidth || 1);
        applyEmphasis(visual, distance, markSize / DESIGN_MARK_SIZE);

        const realIndex = index % initiatives.length;
        const closest = detailDistances[realIndex] ?? Infinity;
        if (Math.abs(distance) < Math.abs(closest)) {
          detailDistances[realIndex] = distance;
        }
      });

      const details = detailsRef.current?.children;
      detailDistances.forEach((distance, realIndex) => {
        const detail = details?.[realIndex];
        if (detail instanceof HTMLElement) {
          applyDetailEmphasis(detail, distance);
        }
      });
    };

    update();
    emblaApi
      .on("scroll", update)
      .on("settle", update)
      .on("resize", update)
      .on("reInit", update);

    return () => {
      emblaApi
        .off("scroll", update)
        .off("settle", update)
        .off("resize", update)
        .off("reInit", update);
    };
  }, [emblaApi, initiatives.length]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () =>
      setSelectedIndex(emblaApi.selectedScrollSnap() % initiatives.length);

    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, initiatives.length]);

  useEffect(() => {
    if (!emblaApi) return;

    const onPointerDown = () => {
      setIsPointerDown(true);
      pauseAutoplay();
    };
    const onPointerUp = () => {
      setIsPointerDown(false);
      scheduleAutoplayResume();
    };

    emblaApi.on("pointerDown", onPointerDown).on("pointerUp", onPointerUp);

    return () => {
      emblaApi.off("pointerDown", onPointerDown).off("pointerUp", onPointerUp);
    };
  }, [emblaApi, pauseAutoplay, scheduleAutoplayResume]);

  useEffect(() => {
    if (!emblaApi) return;

    const viewport = emblaApi.rootNode();
    let accumulated = 0;
    let lastEventAt = 0;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      pauseAutoplay();
      scheduleAutoplayResume();

      if (event.timeStamp - lastEventAt > WHEEL_IDLE_RESET) accumulated = 0;
      lastEventAt = event.timeStamp;
      accumulated += event.deltaX;

      if (Math.abs(accumulated) < WHEEL_STEP_THRESHOLD) return;
      if (accumulated > 0) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }
      accumulated = 0;
    };

    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => viewport.removeEventListener("wheel", onWheel);
  }, [emblaApi, pauseAutoplay, scheduleAutoplayResume]);

  useEffect(() => {
    if (!emblaApi || !autoplayEnabled) return;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      emblaApi.scrollNext();
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(intervalId);
  }, [emblaApi, autoplayEnabled]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!emblaApi) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    pauseAutoplay();
    scheduleAutoplayResume();

    if (event.key === "ArrowLeft") {
      emblaApi.scrollPrev();
    } else {
      emblaApi.scrollNext();
    }
  };

  const activeInitiative = initiatives[selectedIndex] ?? initiatives[0];
  if (!activeInitiative) return null;

  const activeName = t(activeInitiative.nameKey);

  if (initiatives.length < 2) {
    return (
      <div className="flex w-full flex-col items-center">
        <div className="py-4">
          <InitiativeMark
            initiative={activeInitiative}
            name={activeName}
            className="size-[120px] md:size-[200px]"
          />
        </div>
        <InitiativeDetails
          initiatives={initiatives}
          selectedIndex={selectedIndex}
          startIndex={startIndex}
          className="mt-4 md:mt-6"
        />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={t("initiativesCarouselLabel")}
      className="flex w-full flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocusWithin(false);
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "relative mx-auto w-full max-w-[635px] select-none transition-opacity duration-300 [-webkit-tap-highlight-color:transparent] motion-reduce:transition-none md:max-w-[1100px] xl:max-w-[1180px]",
          !emblaApi && "opacity-0"
        )}
      >
        <div
          ref={emblaRef}
          className="overflow-hidden py-4"
          style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
        >
          <ul className="flex [touch-action:pan-y_pinch-zoom]">
            {slides.map(({ initiative, realIndex, isRepeat }, index) => {
              const name = t(initiative.nameKey);

              return (
                <li
                  key={`${initiative.id}-${index}`}
                  role={isRepeat ? undefined : "group"}
                  aria-roledescription={isRepeat ? undefined : "slide"}
                  aria-hidden={isRepeat || undefined}
                  aria-label={
                    isRepeat
                      ? undefined
                      : t("initiativesCarouselSlideLabel", {
                          position: realIndex + 1,
                          total: initiatives.length,
                        })
                  }
                  className="flex shrink-0 grow-0 basis-[127px] items-center justify-center md:basis-[220px] xl:basis-[236px]"
                >
                  <div
                    className="will-change-transform"
                    style={{
                      ...getEmphasisStyle(index - startIndex),
                      filter: "blur(var(--initiative-blur))",
                      transform:
                        "translateX(var(--initiative-shift)) scale(var(--initiative-scale))",
                      opacity: "var(--initiative-opacity)",
                    }}
                  >
                    <button
                      type="button"
                      tabIndex={isRepeat ? -1 : undefined}
                      aria-label={t("initiativesCarouselShowInitiative", {
                        name,
                      })}
                      aria-current={!isRepeat && realIndex === selectedIndex}
                      onClick={() => emblaApi?.scrollTo(index)}
                      className="block rounded-[22%] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-800-dark dark:focus-visible:ring-offset-blue-200-dark"
                    >
                      <InitiativeMark
                        initiative={initiative}
                        name={name}
                        className="size-[120px] md:size-[200px]"
                      />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div
        aria-live={autoplayEnabled ? "off" : "polite"}
        aria-atomic="true"
        className="mt-4 w-full md:mt-6"
      >
        <InitiativeDetails
          initiatives={initiatives}
          selectedIndex={selectedIndex}
          startIndex={startIndex}
          containerRef={detailsRef}
        />
      </div>
    </div>
  );
};

export default InitiativeCarousel;
