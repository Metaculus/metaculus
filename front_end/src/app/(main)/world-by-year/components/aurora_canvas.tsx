"use client";

import { FC, RefObject, useEffect, useRef } from "react";

import useAppTheme from "@/hooks/use_app_theme";

import {
  AuroraConfig,
  CLOCK_RATE,
  FROST_INTERVAL_MS,
  SCROLL_HOLD_MS,
} from "../helpers/aurora_effect";
import { createAuroraRenderer } from "../helpers/aurora_renderer";

type Props = {
  config: AuroraConfig;
  className?: string;
  headRef: RefObject<HTMLElement | null>;
  holdRef: RefObject<boolean>;
  pauseRef?: RefObject<boolean>;
  frostRef?: RefObject<HTMLElement | null>;
  onDrawRef?: RefObject<((canvas: HTMLCanvasElement) => void) | null>;
};

const AuroraCanvas: FC<Props> = ({
  config,
  className,
  headRef,
  holdRef,
  pauseRef,
  frostRef,
  onDrawRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useAppTheme();
  const lightRef = useRef(theme === "light");
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    lightRef.current = theme === "light";
    redrawRef.current?.();
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const renderer = canvas && createAuroraRenderer(canvas, config);
    if (!canvas || !renderer) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let clock = config.phase;
    let last: number | null = null;
    let lastDraw = 0;
    let lastFrost = 0;
    let raf: number | null = null;
    let running = false;
    let scrolling = false;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let near = !("IntersectionObserver" in window);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.resize(rect.width, rect.height, window.devicePixelRatio);
    };

    const headArea = () => {
      const head = headRef.current;
      if (!head) return null;
      const headRect = head.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        left: headRect.left - canvasRect.left,
        top: headRect.top - canvasRect.top,
        width: headRect.width,
        height: headRect.height,
      };
    };

    // The frosted headline is the blurred patch of aurora behind it, clipped
    // to the glyphs with background-clip: text.
    const paintFrost = () => {
      const frost = frostRef?.current;
      if (!frost) return;
      const rect = frost.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio;
      const patch = document.createElement("canvas");
      patch.width = Math.max(1, rect.width);
      patch.height = Math.max(1, rect.height);
      const patchCtx = patch.getContext("2d");
      if (!patchCtx) return;
      patchCtx.filter = "blur(10px)";
      patchCtx.drawImage(
        canvas,
        (rect.left - canvasRect.left) * dpr,
        (rect.top - canvasRect.top) * dpr,
        rect.width * dpr,
        rect.height * dpr,
        0,
        0,
        rect.width,
        rect.height
      );
      frost.style.backgroundImage = `url(${patch.toDataURL()})`;
    };

    const frame = (now: number) => {
      if (
        running &&
        ((lastDraw && now - lastDraw < config.frameIntervalMs) ||
          scrolling ||
          pauseRef?.current)
      ) {
        raf = requestAnimationFrame(frame);
        return;
      }
      lastDraw = now;
      if (holdRef.current) {
        last = null;
        if (running) raf = requestAnimationFrame(frame);
        return;
      }
      const dt = last == null || !running ? 0 : Math.min(now - last, 50);
      last = running ? now : null;
      clock += (dt / 1000) * CLOCK_RATE;

      renderer.draw(clock, lightRef.current, headArea());
      if (frostRef && now - lastFrost > FROST_INTERVAL_MS) {
        lastFrost = now;
        paintFrost();
      }
      onDrawRef?.current?.(canvas);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      last = null;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const sync = () => {
      const active = !document.hidden && document.hasFocus();
      if (near && active && !reduceMotion) start();
      else stop();
    };
    const redraw = () => {
      lastFrost = 0;
      if (!running) frame(performance.now());
    };
    const onResize = () => {
      resize();
      redraw();
    };
    const onScroll = () => {
      scrolling = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        scrolling = false;
      }, SCROLL_HOLD_MS);
    };

    redrawRef.current = redraw;
    resize();
    frame(performance.now());

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              near = !!entry?.isIntersecting;
              sync();
            },
            { rootMargin: "120px" }
          )
        : null;
    observer?.observe(canvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    document.fonts?.ready.then(redraw);
    sync();

    return () => {
      stop();
      clearTimeout(scrollTimer);
      redrawRef.current = null;
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [config, headRef, holdRef, pauseRef, frostRef, onDrawRef]);

  return <canvas ref={canvasRef} className={className} />;
};

export default AuroraCanvas;
