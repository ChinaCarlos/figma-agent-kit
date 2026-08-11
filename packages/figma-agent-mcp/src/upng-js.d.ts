declare module "upng-js" {
  interface DecodedPng {
    width: number;
    height: number;
    data?: ArrayBuffer;
    tabs?: Record<string, unknown>;
  }

  interface UpngApi {
    decode(buffer: ArrayBuffer): DecodedPng;
    toRGBA8(decoded: DecodedPng): ArrayBuffer[];
    encode(
      frames: ArrayBuffer[] | Uint8Array[],
      width: number,
      height: number,
      colorCount?: number,
    ): ArrayBuffer | Uint8Array;
  }

  const UPNG: UpngApi;
  export default UPNG;
}
