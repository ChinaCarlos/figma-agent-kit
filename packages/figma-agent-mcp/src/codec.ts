import { Packr, Unpackr } from "msgpackr";

/**
 * Shared MessagePack codec for bridge WebSocket + leader/follower HTTP RPC.
 * useRecords:false keeps the encoding compatible with the plugin UI codec.
 */
const packr = new Packr({
  useRecords: false,
  sequential: false,
});

const unpackr = new Unpackr({
  useRecords: false,
  sequential: false,
});

export const MSGPACK_CONTENT_TYPE = "application/msgpack";

export function encodeMsgPack(value: unknown): Buffer {
  return Buffer.from(packr.pack(value));
}

export function decodeMsgPack(bytes: Buffer | Uint8Array): unknown {
  return unpackr.unpack(bytes);
}

export function isMsgPackContentType(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.toLowerCase().includes("application/msgpack");
}
