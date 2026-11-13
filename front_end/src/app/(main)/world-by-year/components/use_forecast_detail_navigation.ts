import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const SWIPE_AXIS_LOCK_PX = 8;
const SWIPE_STEP_PX = 64;
const SWIPE_STEP_VELOCITY = 0.45;
const SWIPE_EDGE_RESISTANCE = 0.28;
const SWIPE_MAX_FADE = 0.45;
const SWIPE_FADE_DISTANCE_PX = 700;

type Direction = -1 | 0 | 1;

type Options = {
  count: number;
  initialIndex: number;
  ignoreSwipeSelector?: string;
};

export const useForecastDetailNavigation = ({
  count,
  initialIndex,
  ignoreSwipeSelector,
}: Options) => {
  const [index, setIndex] = useState(initialIndex);
  const boundedIndex = Math.min(Math.max(0, index), Math.max(0, count - 1));
  const [direction, setDirection] = useState<Direction>(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const swipeRef = useRef({ index, count });

  const step = useCallback(
    (delta: -1 | 1) => {
      setIndex((current) => Math.max(0, Math.min(count - 1, current + delta)));
      setDirection(delta);
    },
    [count]
  );
  const stepRef = useRef(step);

  const select = (nextIndex: number) => {
    setIndex(Math.max(0, Math.min(count - 1, nextIndex)));
    setDirection(0);
  };

  useLayoutEffect(() => {
    swipeRef.current = { index: boundedIndex, count };
    stepRef.current = step;
  });

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let swipe: {
      x: number;
      y: number;
      dx: number;
      startedAt: number;
      horizontal: boolean | null;
    } | null = null;
    const springBack = () => {
      const card = cardRef.current;
      if (!card) return;
      card.style.transition =
        "transform .32s cubic-bezier(.23,1,.32,1),opacity .32s ease";
      card.style.transform = "";
      card.style.opacity = "";
    };
    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const target = event.target as Element;
      swipe =
        event.touches.length === 1 &&
        touch &&
        (!ignoreSwipeSelector || !target.closest(ignoreSwipeSelector))
          ? {
              x: touch.clientX,
              y: touch.clientY,
              dx: 0,
              startedAt: performance.now(),
              horizontal: null,
            }
          : null;
    };
    const onMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!swipe || !touch) return;
      let dx = touch.clientX - swipe.x;
      const dy = touch.clientY - swipe.y;
      if (
        swipe.horizontal == null &&
        (Math.abs(dx) > SWIPE_AXIS_LOCK_PX || Math.abs(dy) > SWIPE_AXIS_LOCK_PX)
      ) {
        swipe.horizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (!swipe.horizontal) return;
      event.preventDefault();
      const { index: current, count: currentCount } = swipeRef.current;
      if (
        (dx > 0 && current === 0) ||
        (dx < 0 && current >= currentCount - 1)
      ) {
        dx *= SWIPE_EDGE_RESISTANCE;
      }
      swipe.dx = dx;
      const card = cardRef.current;
      if (!card) return;
      card.style.animation = "none";
      card.style.transition = "none";
      card.style.transform = `translateX(${dx}px)`;
      card.style.opacity = String(
        1 - Math.min(SWIPE_MAX_FADE, Math.abs(dx) / SWIPE_FADE_DISTANCE_PX)
      );
    };
    const onEnd = () => {
      const ended = swipe;
      swipe = null;
      if (!ended?.horizontal) return;
      const delta = ended.dx < 0 ? 1 : -1;
      const velocity =
        Math.abs(ended.dx) / Math.max(1, performance.now() - ended.startedAt);
      const { index: current, count: currentCount } = swipeRef.current;
      const canStep = delta > 0 ? current < currentCount - 1 : current > 0;
      if (
        canStep &&
        (Math.abs(ended.dx) > SWIPE_STEP_PX || velocity > SWIPE_STEP_VELOCITY)
      ) {
        stepRef.current(delta);
      } else {
        springBack();
      }
    };
    const onCancel = () => {
      if (swipe?.horizontal) springBack();
      swipe = null;
    };
    stage.addEventListener("touchstart", onStart, { passive: true });
    stage.addEventListener("touchmove", onMove, { passive: false });
    stage.addEventListener("touchend", onEnd, { passive: true });
    stage.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      stage.removeEventListener("touchstart", onStart);
      stage.removeEventListener("touchmove", onMove);
      stage.removeEventListener("touchend", onEnd);
      stage.removeEventListener("touchcancel", onCancel);
    };
  }, [ignoreSwipeSelector]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    }
  };

  return {
    index: boundedIndex,
    direction,
    step,
    select,
    stageRef,
    cardRef,
    onKeyDown,
  };
};
