import { PNG } from "pngjs";
import * as UPNG from "upng-js";

/**
 * Optional lossless PNG compression for save_screenshots.
 * Re-encodes the PNG via upng-js to strip redundant chunks.
 */
export async function compressPng(buffer: Buffer): Promise<Buffer> {
  const png = PNG.sync.read(buffer);
  const rgba = Buffer.from(png.data);
  const encoded = UPNG.encode(
    [rgba.buffer],
    png.width,
    png.height,
    0,
  );
  return Buffer.from(encoded);
}
