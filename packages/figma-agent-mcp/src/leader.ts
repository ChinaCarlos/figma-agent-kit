import { createServer, type Server } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Bridge } from "./bridge.js";
import {
  decodeMsgPack,
  encodeMsgPack,
  isMsgPackContentType,
  MSGPACK_CONTENT_TYPE,
} from "./codec.js";
import type { RPCRequest, RPCResponse } from "./types.js";

export class Leader {
  private server: Server | null = null;
  private readonly bridge = new Bridge();

  constructor(private readonly port: number) {}

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      this.handleRequest(req, res).catch((err) => {
        console.error("[leader] request error:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Internal error" }));
        }
      });
    });

    this.server.on("upgrade", (req, socket, head) => {
      this.bridge.handleUpgrade(req, socket, head);
    });

    await new Promise<void>((resolve, reject) => {
      this.server!.listen(this.port, () => {
        console.error(`[leader] listening on port ${this.port}`);
        resolve();
      });
      this.server!.on("error", reject);
    });
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && url.pathname === "/ping") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, role: "leader" }));
      return;
    }

    if (req.method === "GET" && url.pathname === "/files") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          files: this.bridge.listFiles(),
        }),
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/rpc") {
      const body = await readBody(req);
      const contentType = req.headers["content-type"];
      let rpc: RPCRequest;

      try {
        if (isMsgPackContentType(contentType) || looksLikeMsgPack(body)) {
          rpc = decodeMsgPack(body) as RPCRequest;
        } else {
          rpc = JSON.parse(body.toString("utf8")) as RPCRequest;
        }
      } catch {
        writeRpcResponse(res, { ok: false, error: "Invalid RPC body" }, true);
        return;
      }

      try {
        const data = await this.bridge.sendRequest(
          rpc.tool,
          rpc.nodeIds,
          rpc.params,
          rpc.fileKey,
        );
        writeRpcResponse(res, { ok: true, data }, true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        writeRpcResponse(res, { ok: false, error: message }, true);
      }
      return;
    }

    res.writeHead(404).end("Not found");
  }

  getBridge(): Bridge {
    return this.bridge;
  }

  async stop(): Promise<void> {
    this.bridge.stop();
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }
  }
}

function writeRpcResponse(
  res: ServerResponse,
  response: RPCResponse,
  useMsgPack: boolean,
): void {
  if (useMsgPack) {
    const payload = encodeMsgPack(response);
    res.writeHead(200, {
      "Content-Type": MSGPACK_CONTENT_TYPE,
      "Content-Length": payload.byteLength,
    });
    res.end(payload);
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

/** MsgPack map/array fixints start below 0x80; JSON objects start with `{` (0x7b). */
function looksLikeMsgPack(body: Buffer): boolean {
  if (body.length === 0) return false;
  const first = body[0];
  // JSON object/array/string/number/null/true/false common prefixes
  if (
    first === 0x7b || // {
    first === 0x5b || // [
    first === 0x22 || // "
    first === 0x74 || // t
    first === 0x66 || // f
    first === 0x6e || // n
    (first >= 0x30 && first <= 0x39) || // 0-9
    first === 0x2d // -
  ) {
    return false;
  }
  return true;
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
