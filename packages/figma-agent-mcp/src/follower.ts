import type { RPCRequest, RPCResponse } from "./types.js";

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

    const res = await fetch(`${this.leaderUrl}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`RPC HTTP ${res.status}: ${await res.text()}`);
    }

    const rpc: RPCResponse = (await res.json()) as RPCResponse;
    if (!rpc.ok) {
      throw new Error(rpc.error ?? "RPC failed");
    }

    return rpc.data;
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
