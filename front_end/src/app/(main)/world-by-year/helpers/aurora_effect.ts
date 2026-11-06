type Ribbon = {
  color: [number, number, number];
  y: number;
  amplitude: number;
  width: number;
  phase: number;
  speed: number;
  alpha: number;
};

export const RIBBONS: Ribbon[] = [
  {
    color: [82, 207, 160],
    y: 0.18,
    amplitude: 0.07,
    width: 0.26,
    phase: 0,
    speed: 0.143,
    alpha: 0.55,
  },
  {
    color: [90, 169, 242],
    y: 0.26,
    amplitude: 0.06,
    width: 0.22,
    phase: 2.1,
    speed: 0.104,
    alpha: 0.42,
  },
  {
    color: [240, 140, 196],
    y: 0.14,
    amplitude: 0.05,
    width: 0.18,
    phase: 4.2,
    speed: 0.169,
    alpha: 0.32,
  },
  {
    color: [140, 230, 200],
    y: 0.34,
    amplitude: 0.08,
    width: 0.3,
    phase: 1.3,
    speed: 0.078,
    alpha: 0.3,
  },
];

export const SHAPE = {
  offset: 0.01,
  thickness: 1.05,
  swing: 0.9,
  edge: 0.48,
  softness: 0.04,
  wave: 0.3,
  waveLength: 2.45,
  drift: -1.05,
  tilt: 0.24,
  arc: -0.05,
};

export const PIXEL = {
  size: 10,
  threshold: 0.18,
  edgeWidth: 0.65,
  noise: 0.25,
  brightness: 0.7,
  speed: 10,
};

export const BAYER_2 = [
  [0, 2],
  [3, 1],
];

export const GAIN = 1.3 * 2.2;
export const RESOLUTION = 0.2;
export const CLOCK_RATE = 0.35;
export const FRAME_INTERVAL_MS = 50;
export const FROST_INTERVAL_MS = 400;
export const SCROLL_HOLD_MS = 140;

export const hash = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};

export const cellHash = (x: number, y: number, k: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

export const createNoiseTile = () => {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 256;
  const tileCtx = tile.getContext("2d");
  if (!tileCtx) return tile;
  const image = tileCtx.createImageData(256, 256);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 110;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  tileCtx.putImageData(image, 0, 0);
  return tile;
};
