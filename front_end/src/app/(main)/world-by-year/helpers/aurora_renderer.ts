import {
  AuroraConfig,
  BAYER_2,
  cellHash,
  createNoiseTile,
  hash,
  RESOLUTION,
} from "./aurora_effect";

export type ClearArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type AuroraRenderer = ReturnType<typeof createAuroraRenderer>;

// Draws one frame of the aurora: soft ribbons under a wandering edge, then
// resampled as dithered pixels, with grain and a clearing behind the headline.
export const createAuroraRenderer = (
  canvas: HTMLCanvasElement,
  config: AuroraConfig
) => {
  const ctx = canvas.getContext("2d");
  const makeCanvas = (willReadFrequently = false) => {
    const el = document.createElement("canvas");
    return [el, el.getContext("2d", { willReadFrequently })] as const;
  };
  const [band, bandCtx] = makeCanvas();
  const [mask, maskCtx] = makeCanvas();
  const [tiny, tinyCtx] = makeCanvas();
  const [cells, cellsCtx] = makeCanvas(true);
  if (!ctx || !bandCtx || !maskCtx || !tinyCtx || !cellsCtx) return null;
  const noise = ctx.createPattern(createNoiseTile(), "repeat");
  const { ribbons, shape, pixel } = config;
  let width = 0;
  let height = 0;

  const resize = (cssWidth: number, cssHeight: number, dpr: number) => {
    width = cssWidth;
    height = cssHeight;
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
    const gain = config.gain * (light ? 0.5 : 1);

    ribbons.forEach((r, ri) => {
      const amplitude = r.amplitude * shape.swing;
      const rgb = `rgba(${r.color.join(",")},`;
      for (let i = 0; i <= cols; i++) {
        const q = hash(i * 7 + ri * 131, config.phase);
        // The first ribbon never skips a column, so no column is empty.
        if (q < 0.28 && ri !== 0) continue;
        const u = -0.25 + (1.5 * i) / cols;
        const center =
          r.y +
          shape.offset +
          amplitude * Math.sin(u * 5.2 + t * r.speed * 2 + r.phase) +
          amplitude *
            0.5 *
            Math.sin(u * 11.5 - t * r.speed * 3.1 + r.phase * 1.7);
        const thickness =
          r.width *
          (1 + 0.35 * Math.sin(u * 3.1 + t * r.speed * 1.4 + ri)) *
          shape.thickness;
        const bright =
          0.82 + 0.18 * Math.sin(u * 7.3 - t * r.speed * 2.6 + r.phase);
        const bottom = (center + thickness / 2) * h;
        const alpha = Math.min(1, r.alpha * bright * gain);
        const strand = q < 0.55 ? 0.5 : q < 0.85 ? 1 : 1.6;
        const strandWidth = colWidth * (1 + (strand - 1) * 0.6);
        const x =
          x0 +
          i * colWidth +
          (hash(i + ri * 17, config.phase) - 0.5) * colWidth * 0.6;
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
    const drift = shape.drift * 3;
    for (let i = 0; i <= maskCols; i++) {
      const u = i / maskCols;
      const fq = shape.waveLength;
      const edge =
        shape.edge +
        shape.wave *
          (0.11 * Math.sin(u * 4.1 * fq - t * 0.21 * drift) +
            0.07 * Math.sin(u * 9.7 * fq - t * 0.16 * drift + 1.9) +
            0.05 * Math.sin(u * 17.3 * fq - t * 0.27 * drift + 0.6)) +
        shape.tilt * (u - 0.5) +
        shape.arc * (1 - 4 * (u - 0.5) * (u - 0.5));
      const soft = Math.max(
        0.015,
        shape.softness +
          Math.min(0.08, shape.softness * 0.8) *
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

  const drawPixels = (t: number, light: boolean) => {
    const size = pixel.size;
    const steps = pixel.levels - 1;
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
    const tick = Math.floor(t * pixel.speed);
    for (let y = 0; y < gridRows; y++) {
      const bayerRow = BAYER_2[y % 2] as number[];
      for (let x = 0; x < gridCols; x++) {
        const i = (y * gridCols + x) * 4;
        const a = (data[i + 3] as number) / 255;
        if (a <= 0.01) continue;
        const v =
          (pixel.edgeWidth < 1 ? Math.min(1, a / pixel.edgeWidth) : a) +
          pixel.threshold;
        const threshold = pixel.ordered
          ? ((bayerRow[x % 2] as number) + 0.5) / 4
          : cellHash(x, y, tick % 7);
        const jitter = (cellHash(x, y, tick) - 0.5) * pixel.noise;
        const level =
          Math.floor(
            Math.max(
              0,
              Math.min(0.999, v + jitter + (threshold - 0.5) / steps)
            ) *
              steps +
              0.5
          ) / steps;
        if (level <= 0) continue;
        if (pixel.flicker > 0 && cellHash(x, y, tick + 13) < pixel.flicker) {
          continue;
        }
        const cell = Math.max(1, Math.round(size * Math.max(0.35, level)));
        ctx.fillStyle = `rgba(${data[i]},${data[i + 1]},${data[i + 2]},${Math.min(1, level * pixel.brightness).toFixed(2)})`;
        ctx.fillRect(
          x * size + (size - cell) / 2,
          y * size + (size - cell) / 2,
          cell,
          cell
        );
      }
    }
    ctx.restore();
  };

  // Lifts the band softly behind the headline so the type keeps contrast.
  const clearBehind = (area: ClearArea) => {
    const w = Math.min(area.width * config.headClearing.width, width * 0.6);
    const h = area.height;
    const cx = area.left + w * 0.45;
    const cy = area.top + h * 0.55;
    const gradient = ctx.createRadialGradient(
      cx,
      cy,
      0,
      cx,
      cy,
      Math.max(w, h) * config.headClearing.radius
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

  const draw = (t: number, light: boolean, head: ClearArea | null) => {
    drawBand(t, light);
    ctx.clearRect(0, 0, width, height);
    drawSoft();
    drawPixels(t, light);
    if (noise) {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = light ? 0.05 : 0.09;
      ctx.fillStyle = noise;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    if (head) clearBehind(head);
  };

  return { resize, draw };
};
