import { Node } from "./node.js";
import { Follower } from "./follower.js";

const POLL_MIN_MS = 3000;
const POLL_MAX_MS = 5000;

export class Election {
  private node: Node;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(private readonly port: number) {
    this.node = new Node(port);
  }

  getNode(): Node {
    return this.node;
  }

  async start(): Promise<void> {
    this.stopped = false;
    await this.tryElect();
    this.schedulePoll();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    await this.node.stop();
  }

  private async tryElect(): Promise<void> {
    try {
      await this.node.becomeLeader();
      console.error("[election] elected as leader");
    } catch (err) {
      console.error(
        "[election] could not become leader:",
        err instanceof Error ? err.message : err,
      );

      const follower = new Follower(this.port);
      const alive = await follower.pingLeader();
      if (alive) {
        await this.node.becomeFollower();
        console.error("[election] following existing leader");
      } else {
        console.error("[election] no leader found, will retry");
      }
    }
  }

  private schedulePoll(): void {
    if (this.stopped) return;

    const delay =
      POLL_MIN_MS + Math.floor(Math.random() * (POLL_MAX_MS - POLL_MIN_MS));

    this.pollTimer = setTimeout(() => {
      this.poll().catch((err) => {
        console.error("[election] poll error:", err);
      });
    }, delay);
  }

  private async poll(): Promise<void> {
    if (this.stopped) return;

    const role = this.node.getRole();

    if (role === "follower") {
      const follower = new Follower(this.port);
      const alive = await follower.pingLeader();
      if (!alive) {
        console.error("[election] leader died, attempting takeover");
        await this.tryElect();
      }
    } else if (role === null) {
      await this.tryElect();
    }

    this.schedulePoll();
  }
}
