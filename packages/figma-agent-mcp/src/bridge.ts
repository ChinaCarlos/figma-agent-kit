import { randomUUID } from "node:crypto";
import type { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import type { IncomingMessage } from "node:http";
import type {
  BridgeRequest,
  BridgeResponse,
  ConnectedFile,
} from "./types.js";

const REQUEST_TIMEOUT_MS = 180_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface FileConnection {
  ws: WebSocket;
  fileKey: string;
  fileName: string;
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

      this.connections.set(fileKey, { ws, fileKey, fileName });

      ws.on("message", (raw) => {
        this.handleMessage(raw.toString());
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

    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`));
      }, REQUEST_TIMEOUT_MS);

      this.pending.set(requestId, { resolve, reject, timer });

      conn.ws.send(JSON.stringify(request), (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(requestId);
          reject(err);
        }
      });
    });
  }

  private handleMessage(raw: string): void {
    let msg: BridgeResponse;
    try {
      msg = JSON.parse(raw) as BridgeResponse;
    } catch {
      console.error("[bridge] invalid JSON message");
      return;
    }

    if (msg.requestId === "pong") {
      return;
    }

    const pending = this.pending.get(msg.requestId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(msg.requestId);

    if (msg.ok) {
      pending.resolve(msg.data);
    } else {
      pending.reject(new Error(msg.error ?? "Unknown bridge error"));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const conn of this.connections.values()) {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify({ requestId: "ping", type: "ping" }));
        }
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
