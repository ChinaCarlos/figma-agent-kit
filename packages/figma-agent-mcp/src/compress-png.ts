import { PNG } from "pngjs";
import UPNGImport from "upng-js";

// CJS interop: some loaders expose `{ default: UPNG }`.
const UPNG = (UPNGImport as unknown as { decode?: unknown }).decode
  ? UPNGImport
  : ((UPNGImport as unknown as { default: typeof UPNGImport }).default ??
    UPNGImport);

/** TinyPNG-style: prefer fidelity; 256 colors first; 128 only when extra savings are clear */
const COLOR_LEVELS = [256, 128] as const;
const MIN_SAVINGS_PCT = 3;
const EXTRA_SAVINGS_FOR_128 = 10;
const MAX_BAD_PIXEL_RATIO = 0.025;
const MAX_AVG_DELTA = 18;

export type CompressMode = "compressed" | "unchanged" | "skipped" | "error";

export interface CompressPngOptions {
  /** Suppress non-fatal warnings (reserved for callers that log themselves) */
  silent?: boolean;
}

export interface CompressPngResult {
  bytes: Uint8Array;
  before: number;
  after: number;
  encodedSize: number | null;
  mode: CompressMode;
  engine?: string;
  colors?: number | null;
  note?: string;
}

interface RgbaMeta {
  rgba: Uint8Array;
  width: number;
  height: number;
}

interface TinyCandidate {
  bytes: Uint8Array;
  after: number;
  engine: string;
  colors: number;
}

function calcSavedPct(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.round((1 - after / before) * 100);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

function countOpaquePixels(rgba: Uint8Array): number {
  let count = 0;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i]! > 0) count += 1;
  }
  return count;
}

function decodeWithUpng(bytes: Uint8Array): RgbaMeta {
  const decoded = UPNG.decode(toArrayBuffer(bytes));
  return {
    rgba: toUint8Array(UPNG.toRGBA8(decoded)[0]!),
    width: decoded.width,
    height: decoded.height,
  };
}

function decodeWithPngjs(bytes: Uint8Array): RgbaMeta {
  const png = PNG.sync.read(Buffer.from(bytes));
  return {
    rgba: new Uint8Array(png.data),
    width: png.width,
    height: png.height,
  };
}

function measureTinyQuality(
  sourceMeta: RgbaMeta,
  outputMeta: RgbaMeta,
): { badRatio: number; avgDelta: number } {
  const src = sourceMeta.rgba;
  const out = outputMeta.rgba;
  if (!src || !out || src.length !== out.length) {
    return { badRatio: 1, avgDelta: 255 };
  }
  let bad = 0;
  let totalDelta = 0;
  const pixels = src.length / 4;
  for (let i = 0; i < src.length; i += 4) {
    const srcA = src[i + 3]!;
    const outA = out[i + 3]!;
    if (srcA < 8 && outA < 8) continue;
    const delta =
      Math.abs(src[i]! - out[i]!) +
      Math.abs(src[i + 1]! - out[i + 1]!) +
      Math.abs(src[i + 2]! - out[i + 2]!) +
      Math.abs(srcA - outA) * 2;
    totalDelta += delta;
    if (delta > 40) bad += 1;
  }
  return {
    badRatio: pixels > 0 ? bad / pixels : 1,
    avgDelta: pixels > 0 ? totalDelta / pixels : 255,
  };
}

function validateTinyOutput(
  sourceMeta: RgbaMeta,
  outputBytes: Uint8Array,
): boolean {
  let out: RgbaMeta;
  try {
    out = decodeWithUpng(outputBytes);
  } catch {
    return false;
  }
  if (out.width !== sourceMeta.width || out.height !== sourceMeta.height) {
    return false;
  }
  const sourceOpaque = countOpaquePixels(sourceMeta.rgba);
  const outputOpaque = countOpaquePixels(out.rgba);
  if (sourceOpaque === 0) return outputOpaque === 0;
  if (outputOpaque === 0) return false;
  if (outputOpaque < sourceOpaque * 0.95) return false;
  const quality = measureTinyQuality(sourceMeta, out);
  if (quality.badRatio > MAX_BAD_PIXEL_RATIO) return false;
  if (quality.avgDelta > MAX_AVG_DELTA) return false;
  return true;
}

function pickBestTinyCandidate(
  candidates: TinyCandidate[],
  before: number,
): TinyCandidate | null {
  const valid: Array<TinyCandidate & { savings: number }> = [];
  for (const item of candidates) {
    if (item.after >= before) continue;
    const savings = calcSavedPct(before, item.after);
    if (savings < MIN_SAVINGS_PCT) continue;
    valid.push({ ...item, savings });
  }
  if (valid.length === 0) return null;

  let best256: (TinyCandidate & { savings: number }) | null = null;
  let best128: (TinyCandidate & { savings: number }) | null = null;
  for (const item of valid) {
    if (item.colors === 256) best256 = item;
    if (item.colors === 128) best128 = item;
  }

  if (best256) {
    if (!best128 || best128.savings - best256.savings < EXTRA_SAVINGS_FOR_128) {
      return best256;
    }
    return best128;
  }
  return best128 ?? valid[0]!;
}

function tryTinyCandidates(
  sourceMeta: RgbaMeta,
  decoderLabel: string,
): TinyCandidate[] {
  const candidates: TinyCandidate[] = [];
  for (const ps of COLOR_LEVELS) {
    try {
      const encoded = UPNG.encode(
        [sourceMeta.rgba],
        sourceMeta.width,
        sourceMeta.height,
        ps,
      );
      const out = toUint8Array(encoded);
      if (!validateTinyOutput(sourceMeta, out)) continue;
      candidates.push({
        bytes: out,
        after: out.length,
        engine: decoderLabel,
        colors: ps,
      });
    } catch {
      /* try next level */
    }
  }
  return candidates;
}

function compressPngLosslessFallback(
  arr: Uint8Array,
  before: number,
): CompressPngResult {
  try {
    const png = PNG.sync.read(Buffer.from(arr));
    const encoded = PNG.sync.write(png, {
      deflateLevel: 9,
      deflateStrategy: 3,
      filterType: -1,
    });
    const out = toUint8Array(encoded);
    const verified = PNG.sync.read(Buffer.from(out));
    const da = png.data;
    const db = verified.data;
    let same = da.length === db.length;
    if (same) {
      for (let i = 0; i < da.length; i++) {
        if (da[i] !== db[i]) {
          same = false;
          break;
        }
      }
    }
    if (same && out.length < before) {
      return {
        bytes: out,
        before,
        after: out.length,
        encodedSize: out.length,
        mode: "compressed",
        engine: "pngjs",
        colors: null,
        note: "pngjs 无损",
      };
    }
  } catch {
    /* fall through */
  }
  return {
    bytes: arr,
    before,
    after: before,
    encodedSize: null,
    mode: "unchanged",
    note: "智能压缩无收益，保留原图",
  };
}

/**
 * Compress a PNG with the same TinyPNG-style pipeline used by the Xc plugin UI.
 * Prefers UPNG palette quantization with quality gates; falls back to pngjs lossless.
 */
export function compressPngLossless(
  pngBytes: Uint8Array | Buffer,
  _opts: CompressPngOptions = {},
): CompressPngResult {
  const arr =
    pngBytes instanceof Uint8Array ? pngBytes : new Uint8Array(pngBytes);
  const before = arr.length;

  const candidates: TinyCandidate[] = [];
  const decoders: Array<{ name: string; decode: (b: Uint8Array) => RgbaMeta }> =
    [
      { name: "UPNG", decode: decodeWithUpng },
      { name: "pngjs", decode: decodeWithPngjs },
    ];

  for (const decoder of decoders) {
    try {
      const sourceMeta = decoder.decode(arr);
      candidates.push(...tryTinyCandidates(sourceMeta, decoder.name));
    } catch {
      /* try next decoder */
    }
  }

  const best = pickBestTinyCandidate(candidates, before);
  if (best) {
    return {
      bytes: best.bytes,
      before,
      after: best.after,
      encodedSize: best.after,
      mode: "compressed",
      engine: best.engine,
      colors: best.colors,
      note: `${best.engine} · ${best.colors} 色`,
    };
  }

  return compressPngLosslessFallback(arr, before);
}

export function calcPngSavedPct(before: number, after: number): number {
  return calcSavedPct(before, after);
}
