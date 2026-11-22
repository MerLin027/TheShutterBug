/**
 * Fit an oversized photograph under the image host's upload cap, at the
 * highest quality that fits.
 *
 * The Cloudinary account is on the Free plan, which refuses any image over
 * 10 MB (MAX_UPLOAD_BYTES in backend/config/cloudinary.js; change the two
 * together). The owner asked (2026-11-22) for big files to be shrunk
 * automatically, at maximum quality. So:
 *
 * 1. A file already under the cap is returned untouched: no re-encode, the
 *    original bytes are what get stored.
 * Never crops, never changes the proportions.
 *
 * 2. Otherwise it is re-encoded as JPEG at FULL resolution, at the highest
 *    quality between QUALITY_FLOOR and 1.0 that fits (binary search).
 * 3. Only if even QUALITY_FLOOR at full resolution is too big are the pixel
 *    dimensions reduced, by as little as the measured size says is needed,
 *    still at QUALITY_FLOOR or better. Visitors are never sent more than
 *    2400 px wide, so this only affects the stored copy.
 *
 * Canvas re-encoding drops EXIF (camera data, GPS) and converts colour to
 * sRGB, which is what the site serves anyway. Orientation is applied first,
 * so a portrait shot stays upright.
 */

/** Cloudinary's cap, in bytes. */
export const UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
/** Aim a little under the cap. */
const TARGET_BYTES = UPLOAD_LIMIT_BYTES - 96 * 1024;
/**
 * Lowest JPEG quality ever used. At 0.95+ JPEG adds no visible noise or
 * blocking to a photograph; below it, pixels are given up instead (owner:
 * "No noise. No quality compromise.").
 */
const QUALITY_FLOOR = 0.95;
/** Safari won't draw a canvas larger than this many pixels. */
const SAFARI_CANVAS_PIXELS = 16_777_216;
/** Files above this are refused outright: decoding them can exhaust memory. */
export const MAX_SOURCE_BYTES = 150 * 1024 * 1024;

export type FitResult = {
  file: File;
  /** True when the file was re-encoded. */
  changed: boolean;
  width: number;
  height: number;
  quality?: number;
};

type Source = { draw: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: File): Promise<Source> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { draw: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // fall through to <img>
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { draw: img, width: img.naturalWidth, height: img.naturalHeight, close: () => {} };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function encoder(src: Source) {
  const canvas = document.createElement("canvas");
  let drawnScale = -1;
  return async function encode(scale: number, quality: number): Promise<Blob | null> {
    if (scale !== drawnScale) {
      canvas.width = Math.max(1, Math.round(src.width * scale));
      canvas.height = Math.max(1, Math.round(src.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#000"; // a transparent PNG gets the site's dark ground
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src.draw, 0, 0, canvas.width, canvas.height);
      drawnScale = scale;
    }
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    // Safari returns PNG (or null) when it can't encode; treat as a failure.
    return blob && blob.type === "image/jpeg" ? blob : null;
  };
}

function jpegName(name: string) {
  return (name.replace(/\.[^.]+$/, "") || "photo") + ".jpg";
}

export async function fitForUpload(file: File): Promise<FitResult> {
  if (file.size <= TARGET_BYTES) {
    return { file, changed: false, width: 0, height: 0 };
  }

  const src = await decode(file);
  try {
    const encode = encoder(src);
    const pixels = src.width * src.height;
    let scale = 1;

    // Full resolution at the quality floor. Safari can't draw past ~16.7 MP,
    // so if it fails there, start from the largest size it can.
    let blob = await encode(scale, QUALITY_FLOOR);
    if (!blob && pixels > SAFARI_CANVAS_PIXELS) {
      scale = Math.sqrt(SAFARI_CANVAS_PIXELS / pixels) * 0.999;
      blob = await encode(scale, QUALITY_FLOOR);
    }
    if (!blob) throw new Error("This browser couldn't prepare the image");

    if (blob.size <= TARGET_BYTES) {
      // It fits: find the highest quality that still does.
      let lo = QUALITY_FLOOR;
      let best = blob;
      let hi = 1;
      for (let i = 0; i < 5; i++) {
        const q = (lo + hi) / 2;
        const b = await encode(scale, q);
        if (b && b.size <= TARGET_BYTES) {
          lo = q;
          best = b;
        } else {
          hi = q;
        }
      }
      return finish(best, lo);
    }

    // Too big even at the floor: reduce the pixels, as little as the
    // measured size says, and re-check (JPEG size is roughly linear in area).
    let tooBig = scale;
    let fits: { scale: number; blob: Blob } | null = null;
    for (let i = 0; i < 6 && !fits; i++) {
      scale *= Math.sqrt(TARGET_BYTES / blob.size) * 0.98;
      const b = await encode(scale, QUALITY_FLOOR);
      if (!b) throw new Error("This browser couldn't prepare the image");
      blob = b;
      if (blob.size <= TARGET_BYTES) fits = { scale, blob };
      else tooBig = scale;
    }
    if (!fits) throw new Error("Couldn't bring the image under 10 MB");
    // Then keep as many pixels as possible: search between the size that
    // fits and the one that didn't.
    for (let i = 0; i < 5; i++) {
      const mid: number = (fits.scale + tooBig) / 2;
      const b = await encode(mid, QUALITY_FLOOR);
      if (b && b.size <= TARGET_BYTES) fits = { scale: mid, blob: b };
      else tooBig = mid;
    }
    scale = fits.scale;
    return finish(fits.blob, QUALITY_FLOOR);

    function finish(b: Blob, quality: number): FitResult {
      return {
        file: new File([b], jpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified }),
        changed: true,
        width: Math.round(src.width * scale),
        height: Math.round(src.height * scale),
        quality,
      };
    }
  } finally {
    src.close();
  }
}
