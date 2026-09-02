"use client";

import { FC, useEffect, useRef, useState } from "react";

import cn from "@/utils/core/cn";

// Straight from components/logos/metaculus_mark.svg: one closed subpath, no
// holes and no curves, so the same data serves as the traced outline and the
// filled mark. Kept as a literal rather than imported from the component,
// which renders an <svg> we cannot stroke.
const LOGO_VIEW_BOX = "0 0 13 17";
const LOGO_ASPECT = 13 / 17;
const LOGO_PATH =
  "M2.86441 4.9955V17H0V0H4.03955L6.46328 8.46177L8.88701 0H13V17H10.0621V4.9955L7.19774 17H5.72881L2.86441 4.9955Z";

type LoaderPhase = "loop" | "closingOutline" | "fadingFill" | "done";

type Props = {
  loading?: boolean;
  isComplete?: boolean;
  /** Height in pixels; width follows the mark's 13:17 ratio. */
  size?: number;
  strokeWidth?: number;
  loopDurationSeconds?: number;
  fillFadeSeconds?: number;
  className?: string;
  ariaLabel?: string;
  onDone?: () => void;
};

const CLOSE_OUTLINE_SECONDS = 0.35;

const LogoTraceLoader: FC<Props> = ({
  loading = true,
  isComplete = false,
  size = 40,
  strokeWidth = 2,
  loopDurationSeconds = 1.6,
  fillFadeSeconds = 0.35,
  className,
  ariaLabel,
  onDone,
}) => {
  const [phase, setPhase] = useState<LoaderPhase>("loop");
  const [reducedMotion, setReducedMotion] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.();
  };

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Nothing to trace for someone who asked not to see motion: show the mark
  // they would have ended up with and report completion straight away.
  useEffect(() => {
    if (!reducedMotion) return;
    setPhase("done");
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const settled = isComplete || !loading;

  // Timers rather than transition callbacks: an animation that never ends -
  // a backgrounded tab pauses them - would otherwise strand the loader
  // mid-phase and never call onDone.
  //
  // Deliberately not keyed on phase. This effect changes phase, so depending on
  // it would re-run the effect immediately, and the cleanup would cancel the
  // timer that carries the loader on to the fill - leaving it stuck on the
  // closed outline forever.
  useEffect(() => {
    if (reducedMotion || !settled) return;
    setPhase((current) => (current === "loop" ? "closingOutline" : current));
    const toFill = setTimeout(
      () =>
        setPhase((current) =>
          current === "closingOutline" ? "fadingFill" : current
        ),
      CLOSE_OUTLINE_SECONDS * 1000
    );
    return () => clearTimeout(toFill);
  }, [reducedMotion, settled]);

  useEffect(() => {
    if (phase !== "fadingFill") return;
    const toDone = setTimeout(() => {
      setPhase("done");
      finish();
    }, fillFadeSeconds * 1000);
    return () => clearTimeout(toDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fillFadeSeconds]);

  const showFill = phase === "fadingFill" || phase === "done";

  return (
    <svg
      role="status"
      aria-label={ariaLabel}
      viewBox={LOGO_VIEW_BOX}
      // Both dimensions are set from the first render so the surrounding
      // layout never shifts as the loader changes phase
      width={Math.round(size * LOGO_ASPECT)}
      height={size}
      className={cn("overflow-visible", className)}
    >
      {/* The route the stroke follows, faint, so the mark reads as a whole
      even when the travelling segment is on the far side of it */}
      {!showFill && (
        <path
          d={LOGO_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={Math.max(1, strokeWidth / 2)}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.18}
        />
      )}

      {!showFill && (
        <path
          d={LOGO_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          // The outline turns back on itself at the two V apexes, where a
          // miter would spike well past the letterform
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={phase === "loop" ? "0.16 0.84" : "1 0"}
          // The phase below is flipped by an effect, so it is a frame late;
          // this stops the loop being painted at all when motion is unwanted
          className="motion-reduce:!animate-none"
          style={
            phase === "loop"
              ? {
                  animation: `logo-trace-loop ${loopDurationSeconds}s linear infinite`,
                }
              : {
                  transition: `stroke-dasharray ${CLOSE_OUTLINE_SECONDS}s ease-out`,
                }
          }
        />
      )}

      {showFill && (
        <path
          d={LOGO_PATH}
          fill="currentColor"
          style={{
            animation:
              phase === "fadingFill"
                ? `logo-trace-fill ${fillFadeSeconds}s ease-out`
                : undefined,
          }}
        />
      )}
    </svg>
  );
};

export default LogoTraceLoader;
