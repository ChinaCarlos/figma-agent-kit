import { Packr, Unpackr } from "msgpackr";

/**
 * Browser MessagePack codec injected into the plugin UI.
 * Must stay compatible with packages/figma-agent-mcp/src/codec.ts
 * (useRecords: false).
 */
const packr = new Packr({
  useRecords: false,
  sequential: false,
});

const unpackr = new Unpackr({
  useRecords: false,
  sequential: false,
});

declare global {
  interface Window {
    __figmaAgentCodec?: {
      encode: (value: unknown) => Uint8Array;
      decode: (bytes: ArrayBuffer | Uint8Array) => unknown;
    };
  }
}

window.__figmaAgentCodec = {
  encode(value: unknown): Uint8Array {
    return packr.pack(value) as Uint8Array;
  },
  decode(bytes: ArrayBuffer | Uint8Array): unknown {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return unpackr.unpack(view);
  },
};
