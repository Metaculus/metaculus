"use client";

import { FC, RefObject, useEffect, useRef } from "react";

import useAppTheme from "@/hooks/use_app_theme";

import {
  BAYER_2,
  cellHash,
  CLOCK_RATE,
  createNoiseTile,
  FRAME_INTERVAL_MS,
  FROST_INTERVAL_MS,
  GAIN,
  hash,
  PIXEL,
  RESOLUTION,
  RIBBONS,
  SCROLL_HOLD_MS,
  SHAPE,
} from "../helpers/aurora_effect";

type Props = {
  headRef: RefObject<HTMLElement | null>;
  frostRef: RefObject<HTMLElement | null>;
  holdRef: RefObject<boolean>;
};

const HeroAurora: FC<Props> = ({ headRef, frostRef, holdRef }) => {
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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const makeCanvas = (willReadFrequently = false) => {
      const el = document.createElement("canvas");
      return [el, el.getContext("2d", { willReadFrequently })] as const;
    };
    const [band, bandCtx] = makeCanvas();
    const [mask, maskCtx] = makeCanvas();
    const [tiny, tinyCtx] = makeCanvas();
    const [cells, cellsCtx] = makeCanvas(true);
    if (!bandCtx || !maskCtx || !tinyCtx || !cellsCtx) return;
    const noise = ctx.createPattern(createNoiseTile(), "repeat");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let clock = 0;
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
      const dpr = window.devicePixelRatio;
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      band.width = mask.width = Math.max(2, width * RESOLUTION);
      band.height = mask.height = Math.max(2, height * RESOLUTION);
    };

    const drawBand = (t: number, light: boolean) => {
      const w = band.width;
      const h = band.height;
      bandCtx.clearRect(0, 0, w, h);
      bandCtx.globalCompositeOperation = light ? "multiply" : "source-over";
      const cols = Math.max(60, Math.round((w * 1.5) / 2));
      const colWidth = (w * 1.5) / cols;
      const x0 = -w * 0.25;
      const gain = GAIN * (light ? 0.5 : 1);

      RIBBONS.forEach((r, ri) => {
        const amplitude = r.amplitude * SHAPE.swing;
        const rgb = `rgba(${r.color.join(",")},`;
        for (let i = 0; i <= cols; i++) {
          const q = hash(i * 7 + ri * 131);
          // The first ribbon never skips a column, so no column is empty.
          if (q < 0.28 && ri !== 0) continue;
          const u = -0.25 + (1.5 * i) / cols;
          const center =
            r.y +
            SHAPE.offset +
            amplitude * Math.sin(u * 5.2 + t * r.speed * 2 + r.phase) +
            amplitude *
              0.5 *
              Math.sin(u * 11.5 - t * r.speed * 3.1 + r.phase * 1.7);
          const thickness =
            r.width *
            (1 + 0.35 * Math.sin(u * 3.1 + t * r.speed * 1.4 + ri)) *
            SHAPE.thickness;
          const bright =
            0.82 + 0.18 * Math.sin(u * 7.3 - t * r.speed * 2.6 + r.phase);
          const bottom = (center + thickness / 2) * h;
          const alpha = Math.min(1, r.alpha * bright * gain);
          const strand = q < 0.55 ? 0.5 : q < 0.85 ? 1 : 1.6;
          const strandWidth = colWidth * (1 + (strand - 1) * 0.6);
          const x =
            x0 + i * colWidth + (hash(i + ri * 17) - 0.5) * colWidth * 0.6;
          const gradient = bandCtx.createLinearGradient(0, 0, 0, bottom);
          gradient.addColorStop(0, `${rgb}${alpha})`);
          gradient.addColorStop(0.35, `${rgb}${alpha})`);
          gradient.addColorStop(0.6, `${rgb}${alpha * 0.6})`);
          gradient.addColorStop(1, `${rgb}0)`);
          bandCtx.fillStyle = gradient;
          bandCtx.fillRect(x, 0, strandWidth, bottom);
        }
      });

      maskCtx.clearRect(0, 0, w, h);
      const maskCols = Math.max(48, Math.round(w / 3));
      const maskColWidth = w / maskCols;
      const drift = SHAPE.drift * 3;
      for (let i = 0; i <= maskCols; i++) {
        const u = i / maskCols;
        const fq = SHAPE.waveLength;
        const edge =
          SHAPE.edge +
          SHAPE.wave *
            (0.11 * Math.sin(u * 4.1 * fq - t * 0.21 * drift) +
              0.07 * Math.sin(u * 9.7 * fq - t * 0.16 * drift + 1.9) +
              0.05 * Math.sin(u * 17.3 * fq - t * 0.27 * drift + 0.6)) +
          SHAPE.tilt * (u - 0.5) +
          SHAPE.arc * (1 - 4 * (u - 0.5) * (u - 0.5));
        const soft = Math.max(
          0.015,
          SHAPE.softness +
            Math.min(0.08, SHAPE.softness * 0.8) *
              Math.sin(u * 6.3 - t * 0.13 + 2.4)
        );
        const gradient = maskCtx.createLinearGradient(
          0,
          (edge - soft) * h,
          0,
          (edge + soft) * h
        );
        gradient.addColorStop(0, "rgba(0,0,0,1)");
        gradient.addColorStop(0.45, "rgba(0,0,0,0.55)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        maskCtx.fillStyle = gradient;
        maskCtx.fillRect(i * maskColWidth, 0, maskColWidth + 1, h);
      }

      bandCtx.save();
      bandCtx.globalCompositeOperation = "destination-in";
      bandCtx.drawImage(mask, 0, 0);
      bandCtx.restore();
    };

    const drawSoft = () => {
      tiny.width = Math.max(2, Math.round(band.width / 5));
      tiny.height = Math.max(2, Math.round(band.height / 5));
      tinyCtx.imageSmoothingEnabled = true;
      tinyCtx.clearRect(0, 0, tiny.width, tiny.height);
      tinyCtx.drawImage(band, 0, 0, tiny.width, tiny.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tiny, 0, 0, width, height);
    };

    // Samples the soft render on a coarse grid and redraws it as ordered-dither
    // pixels, which is what gives the band its stepped lower edge.
    const drawPixels = (t: number, light: boolean) => {
      const size = PIXEL.size;
      const gridCols = Math.ceil(width / size);
      const gridRows = Math.ceil(height / size);
      cells.width = gridCols;
      cells.height = gridRows;
      cellsCtx.imageSmoothingEnabled = true;
      cellsCtx.clearRect(0, 0, gridCols, gridRows);
      cellsCtx.drawImage(canvas, 0, 0, gridCols, gridRows);
      const data = cellsCtx.getImageData(0, 0, gridCols, gridRows).data;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = light ? "multiply" : "lighter";
      ctx.imageSmoothingEnabled = false;
      const tick = Math.floor(t * PIXEL.speed);
      for (let y = 0; y < gridRows; y++) {
        const bayerRow = BAYER_2[y % 2] as number[];
        for (let x = 0; x < gridCols; x++) {
          const i = (y * gridCols + x) * 4;
          const a = (data[i + 3] as number) / 255;
          if (a <= 0.01) continue;
          const v = Math.min(1, a / PIXEL.edgeWidth) + PIXEL.threshold;
          const threshold = ((bayerRow[x % 2] as number) + 0.5) / 4;
          const jitter = (cellHash(x, y, tick) - 0.5) * PIXEL.noise;
          const level = Math.floor(
            Math.max(0, Math.min(0.999, v + jitter + threshold - 0.5)) + 0.5
          );
          if (level <= 0) continue;
          ctx.fillStyle = `rgba(${data[i]},${data[i + 1]},${data[i + 2]},${PIXEL.brightness})`;
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
      ctx.restore();
    };

    const clearBehindHeadline = () => {
      const head = headRef.current;
      if (!head) return;
      const headRect = head.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      const left = headRect.left - canvasRect.left;
      const top = headRect.top - canvasRect.top;
      const w = Math.min(headRect.width * 0.62, width * 0.6);
      const h = headRect.height;
      const cx = left + w * 0.45;
      const cy = top + h * 0.55;
      const gradient = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        Math.max(w, h) * 0.78
      );
      gradient.addColorStop(0, "rgba(0,0,0,0.22)");
      gradient.addColorStop(0.55, "rgba(0,0,0,0.132)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    };

    // The frosted headline is the blurred patch of aurora behind it, clipped
    // to the glyphs with background-clip: text.
    const paintFrost = () => {
      const frost = frostRef.current;
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
      const light = lightRef.current;
      if (
        running &&
        ((lastDraw && now - lastDraw < FRAME_INTERVAL_MS) || scrolling)
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

      drawBand(clock, light);
      ctx.clearRect(0, 0, width, height);
      drawSoft();
      drawPixels(clock, light);
      if (noise) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = light ? 0.05 : 0.09;
        ctx.fillStyle = noise;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
      clearBehindHeadline();
      if (now - lastFrost > FROST_INTERVAL_MS) {
        lastFrost = now;
        paintFrost();
      }
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
  }, [headRef, frostRef, holdRef]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-screen overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute -left-20 -top-20 h-[calc(100%+160px)] w-[calc(100%+160px)]"
      />
    </div>
  );
};

export default HeroAurora;
