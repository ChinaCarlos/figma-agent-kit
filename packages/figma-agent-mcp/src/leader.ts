import { createServer, type Server } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { Bridge } from "./bridge.js";
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
          res.writeHead(500).end(JSON.stringify({ error: "Internal error" }));
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

    if (req.method === "POST" && url.pathname === "/rpc") {
      const body = await readBody(req);
      let rpc: RPCRequest;
      try {
        rpc = JSON.parse(body) as RPCRequest;
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Invalid JSON body" }));
        return;
      }

      try {
        const data = await this.bridge.sendRequest(
          rpc.tool,
          rpc.nodeIds,
          rpc.params,
          rpc.fileKey,
        );
        const response: RPCResponse = { ok: true, data };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const response: RPCResponse = { ok: false, error: message };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
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

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
