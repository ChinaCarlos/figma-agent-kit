import { Leader } from "./leader.js";
import { Follower } from "./follower.js";
import { Role } from "./types.js";

export class Node {
  private role: Role | null = null;
  private leader: Leader | null = null;
  private follower: Follower | null = null;

  constructor(private readonly port: number) {}

  getRole(): Role | null {
    return this.role;
  }

  async becomeLeader(): Promise<void> {
    if (this.role === Role.Leader) return;

    await this.stopCurrent();

    const leader = new Leader(this.port);
    await leader.start();
    this.leader = leader;
    this.role = Role.Leader;
    console.error("[node] became leader");
  }

  async becomeFollower(): Promise<void> {
    if (this.role === Role.Follower) return;

    await this.stopCurrent();

    this.follower = new Follower(this.port);
    this.role = Role.Follower;
    console.error("[node] became follower");
  }

  async send(
    tool: string,
    nodeIds?: string[],
    params?: Record<string, unknown>,
    fileKey?: string,
  ): Promise<unknown> {
    if (this.role === Role.Leader && this.leader) {
      return this.leader.getBridge().sendRequest(tool, nodeIds, params, fileKey);
    }

    if (this.role === Role.Follower && this.follower) {
      return this.follower.send(tool, nodeIds, params, fileKey);
    }

    throw new Error("Node has no active role");
  }

  async listFiles(): Promise<{ fileKey: string; fileName: string }[]> {
    if (this.role === Role.Leader && this.leader) {
      return this.leader.getBridge().listFiles();
    }
    if (this.role === Role.Follower && this.follower) {
      return this.follower.listFiles();
    }
    return [];
  }

  async stop(): Promise<void> {
    await this.stopCurrent();
    this.role = null;
  }

  private async stopCurrent(): Promise<void> {
    if (this.leader) {
      await this.leader.stop();
      this.leader = null;
    }
    this.follower = null;
  }
}
