import { randomUUID } from "node:crypto";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import type { IncomingMessage } from "node:http";
import { decodeMsgPack, encodeMsgPack } from "./codec.js";
import type {
  BridgeRequest,
  BridgeResponse,
  ConnectedFile,
} from "./types.js";

const REQUEST_TIMEOUT_MS = 180_000;
const HEARTBEAT_INTERVAL_MS = 30_000;
/** Drop a connection if it misses this many heartbeat rounds. */
const HEARTBEAT_MISS_LIMIT = 2;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface FileConnection {
  ws: WebSocket;
  fileKey: string;
  fileName: string;
  missedHeartbeats: number;
}

function isControlMessage(msg: Record<string, unknown>): boolean {
  return msg.type === "ping" || msg.type === "pong";
}

function toBuffer(raw: WebSocket.RawData): Buffer {
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof ArrayBuffer) return Buffer.from(raw);
  if (ArrayBuffer.isView(raw)) {
    return Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
  }
  if (Array.isArray(raw)) {
    return Buffer.concat(raw.map((part) => toBuffer(part)));
  }
  return Buffer.from(String(raw));
}

export class Bridge {
  private readonly wss = new WebSocketServer({ noServer: true });
  private readonly connections = new Map<string, FileConnection>();
  private readonly pending = new Map<string, PendingRequest>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url ?? "/", "http://localhost");
      const fileKey = url.searchParams.get("fileKey") ?? "";
      const fileName = url.searchParams.get("fileName") ?? "";

      if (!fileKey) {
        console.error("[bridge] connection rejected: missing fileKey");
        ws.close(4000, "fileKey required");
        return;
      }

      console.error(`[bridge] connected: ${fileKey} (${fileName})`);

      const existing = this.connections.get(fileKey);
      if (existing) {
        existing.ws.close(4001, "replaced");
      }

      this.connections.set(fileKey, {
        ws,
        fileKey,
        fileName,
        missedHeartbeats: 0,
      });

      ws.on("message", (raw, isBinary) => {
        this.handleMessage(fileKey, raw, isBinary);
      });

      ws.on("close", () => {
        const current = this.connections.get(fileKey);
        if (current?.ws === ws) {
          this.connections.delete(fileKey);
          console.error(`[bridge] disconnected: ${fileKey}`);
        }
      });

      ws.on("error", (err) => {
        console.error(`[bridge] socket error (${fileKey}):`, err.message);
      });
    });

    this.startHeartbeat();
  }

  getWebSocketServer(): WebSocketServer {
    return this.wss;
  }

  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/ws") {
      socket.destroy();
      return;
    }
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit("connection", ws, req);
    });
  }

  listFiles(): ConnectedFile[] {
    return Array.from(this.connections.values()).map((c) => ({
      fileKey: c.fileKey,
      fileName: c.fileName,
    }));
  }

  async sendRequest(
    type: string,
    nodeIds?: string[],
    params?: Record<string, unknown>,
    fileKey?: string,
  ): Promise<unknown> {
    const targetKey = fileKey ?? this.connections.keys().next().value;
    if (!targetKey) {
      throw new Error("No Figma plugin connected");
    }

    const conn = this.connections.get(targetKey);
    if (!conn || conn.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`No active connection for fileKey: ${targetKey}`);
    }

    const requestId = randomUUID();
    const request: BridgeRequest = { requestId, type, nodeIds, params };
    const payload = encodeMsgPack(request);

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timer });

      conn.ws.send(payload, { binary: true }, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(requestId);
          reject(err);
        }
      });
    });
  }

  private handleMessage(
    fileKey: string,
    raw: WebSocket.RawData,
    isBinary: boolean,
  ): void {
    let msg: Record<string, unknown>;
    try {
      if (isBinary || Buffer.isBuffer(raw) || raw instanceof ArrayBuffer) {
        msg = decodeMsgPack(toBuffer(raw)) as Record<string, unknown>;
      } else {
        // Legacy text frames (should not be used after MsgPack migration).
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      }
    } catch (err) {
      console.error(
        "[bridge] invalid message:",
        err instanceof Error ? err.message : err,
      );
      return;
    }

    if (isControlMessage(msg)) {
      if (msg.type === "pong") {
        const conn = this.connections.get(fileKey);
        if (conn) conn.missedHeartbeats = 0;
      }
      return;
    }

    const response = msg as unknown as BridgeResponse;
    if (!response.requestId) return;

    const pending = this.pending.get(response.requestId);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(response.requestId);

    if (response.ok) {
      pending.resolve(response.data);
    } else {
      pending.reject(new Error(response.error ?? "Unknown bridge error"));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const [fileKey, conn] of this.connections) {
        if (conn.ws.readyState !== WebSocket.OPEN) continue;

        if (conn.missedHeartbeats >= HEARTBEAT_MISS_LIMIT) {
          console.error(`[bridge] heartbeat timeout, closing: ${fileKey}`);
          conn.ws.close(4002, "heartbeat timeout");
          this.connections.delete(fileKey);
          continue;
        }

        conn.missedHeartbeats += 1;
        conn.ws.send(encodeMsgPack({ type: "ping" }), { binary: true });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Bridge stopped"));
    }
    this.pending.clear();

    for (const conn of this.connections.values()) {
      conn.ws.close();
    }
    this.connections.clear();
    this.wss.close();
  }
}
