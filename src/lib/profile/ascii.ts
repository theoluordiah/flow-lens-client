import type { PortraitCharset } from "./types";

/** Character ramps from empty to dense. */
export const CHARSET_RAMPS: Record<PortraitCharset, string> = {
  minimal: " .:-=+*#",
  standard: " .:-=+*#%@",
  detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
};

export const CHARSET_LABELS: Record<PortraitCharset, string> = {
  minimal: "Minimal",
  standard: "Standard",
  detailed: "Detailed",
  blocks: "Blocks",
};

export interface AsciiOptions {
  charset: PortraitCharset;
  /** 1 = unchanged; >1 pushes tones apart. */
  contrast: number;
  /** -1…1 added after contrast. */
  brightness: number;
  /**
   * Dense characters for dark pixels instead of bright ones. Light-on-dark display
   * wants bright = dense, so callers XOR this with the theme's lightness.
   */
  invert: boolean;
}

export const MAX_PORTRAIT_ROWS = 120;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

/** Rows needed to keep the photo's aspect ratio given a character cell of 0.6em × 1.2em. */
export function rowsFor(columns: number, width: number, height: number): number {
  const rows = Math.round(columns * (height / width) * 0.5);
  return Math.max(1, Math.min(MAX_PORTRAIT_ROWS, rows));
}

/**
 * Converts a grid of luminance values (0 = black … 1 = white, row-major) to ASCII lines.
 * NaN marks a transparent cell, which always becomes a space. Pure so it can be tested
 * without a canvas.
 */
export function luminanceToAscii(lum: ArrayLike<number>, width: number, height: number, opts: AsciiOptions): string[] {
  const ramp = CHARSET_RAMPS[opts.charset] ?? CHARSET_RAMPS.standard;
  const last = ramp.length - 1;
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      let v = lum[y * width + x] ?? 0;
      if (Number.isNaN(v)) {
        line += " ";
        continue;
      }
      v = (v - 0.5) * opts.contrast + 0.5 + opts.brightness;
      v = Math.min(1, Math.max(0, v));
      if (opts.invert) v = 1 - v;
      line += ramp[Math.round(v * last)];
    }
    lines.push(line);
  }
  return trimBlankEdges(lines);
}

/** Drops fully blank rows at the top and bottom so the SVG has no dead space. */
export function trimBlankEdges(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return lines.slice(start, end);
}

export class PortraitError extends Error {}

export function checkPhotoFile(file: File): void {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    throw new PortraitError("Use a PNG, JPEG, WebP or GIF image.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new PortraitError("That image is larger than 8 MB. Choose a smaller photo.");
  }
}

/** Decodes an image in the browser. Nothing is uploaded. */
export async function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  const img = new Image();
  if (crossOrigin) img.crossOrigin = "anonymous";
  img.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new PortraitError("Couldn't read that image. Try a different file."));
    img.src = src;
  });
  if (!img.naturalWidth || !img.naturalHeight) throw new PortraitError("That image has no pixels.");
  if (img.naturalWidth > 10000 || img.naturalHeight > 10000) {
    throw new PortraitError("That image is too large to process (max 10,000 px per side).");
  }
  return img;
}

/**
 * Mean luminance of the outermost cells (NaN cells ignored), or null if they're all
 * transparent. Used to guess whether the photo's background is light or dark.
 */
export function borderLuminance(lum: ArrayLike<number>, width: number, height: number): number | null {
  let total = 0;
  let count = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y !== 0 && y !== height - 1 && x !== 0 && x !== width - 1) continue;
      const v = lum[y * width + x];
      if (Number.isNaN(v)) continue;
      total += v;
      count++;
    }
  }
  return count ? total / count : null;
}

/** True when the photo's background is light, so shading should be flipped to keep it empty. */
export function hasLightBackground(img: HTMLImageElement): boolean {
  const columns = 32;
  const { lum, rows } = sampleLuminance(img, columns);
  return (borderLuminance(lum, columns, rows) ?? 0) > 0.55;
}

export function imageToAscii(img: HTMLImageElement, columns: number, opts: AsciiOptions): string[] {
  const { lum, rows } = sampleLuminance(img, columns);
  return luminanceToAscii(lum, columns, rows, opts);
}

/** Samples the image down to one luminance value per character cell using a canvas. */
function sampleLuminance(img: HTMLImageElement, columns: number): { lum: Float32Array; rows: number } {
  const rows = rowsFor(columns, img.naturalWidth, img.naturalHeight);
  // Draw at 4× and box-average for smoother tones than a single downscale gives.
  const s = 4;
  const canvas = document.createElement("canvas");
  canvas.width = columns * s;
  canvas.height = rows * s;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new PortraitError("Your browser can't process images here.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    throw new PortraitError("This image can't be read by the browser (cross-origin). Upload it instead.");
  }

  const lum = new Float32Array(columns * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      let total = 0;
      let alpha = 0;
      for (let dy = 0; dy < s; dy++) {
        for (let dx = 0; dx < s; dx++) {
          const i = ((y * s + dy) * canvas.width + (x * s + dx)) * 4;
          const a = data[i + 3] / 255;
          total += ((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255) * a;
          alpha += a;
        }
      }
      // Mostly transparent cells (cut-out backgrounds) stay empty in every theme.
      lum[y * columns + x] = alpha < (s * s) / 2 ? NaN : total / alpha;
    }
  }
  return { lum, rows };
}
