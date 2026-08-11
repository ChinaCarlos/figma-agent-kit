import {
  decodeMsgPack,
  encodeMsgPack,
  isMsgPackContentType,
  MSGPACK_CONTENT_TYPE,
} from "./codec.js";
import type { ConnectedFile, RPCRequest, RPCResponse } from "./types.js";

export class Follower {
  constructor(
    private readonly port: number,
    private readonly leaderUrl = `http://localhost:${port}`,
  ) {}

  async send(
    tool: string,
    nodeIds?: string[],
    params?: Record<string, unknown>,
    fileKey?: string,
  ): Promise<unknown> {
    const body: RPCRequest = { tool, nodeIds, params, fileKey };
    const payload = encodeMsgPack(body);

    const res = await fetch(`${this.leaderUrl}/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": MSGPACK_CONTENT_TYPE,
        Accept: MSGPACK_CONTENT_TYPE,
      },
      body: new Uint8Array(payload),
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP ${res.status}: ${await res.text()}`);
    }

    const rpc = await readRpcResponse(res);
    if (!rpc.ok) {
      throw new Error(rpc.error ?? "RPC failed");
    }

    return rpc.data;
  }

  async listFiles(): Promise<ConnectedFile[]> {
    try {
      const res = await fetch(`${this.leaderUrl}/files`);
      if (!res.ok) return [];
      const data = (await res.json()) as {
        ok?: boolean;
        files?: ConnectedFile[];
      };
      return data.ok === true && Array.isArray(data.files) ? data.files : [];
    } catch {
      return [];
    }
  }

  async pingLeader(): Promise<boolean> {
    try {
      const res = await fetch(`${this.leaderUrl}/ping`);
      if (!res.ok) return false;
      const data = (await res.json()) as { ok?: boolean; role?: string };
      return data.ok === true && data.role === "leader";
    } catch {
      return false;
    }
  }
}

async function readRpcResponse(res: Response): Promise<RPCResponse> {
  const contentType = res.headers.get("content-type");
  if (isMsgPackContentType(contentType)) {
    const bytes = new Uint8Array(await res.arrayBuffer());
    return decodeMsgPack(bytes) as RPCResponse;
  }
  return (await res.json()) as RPCResponse;
}
