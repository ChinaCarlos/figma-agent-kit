# Bridge protocol

This document describes how **figma-agent-mcp** talks to **figma-agent-plugin**. All traffic is on localhost.

## Overview

```text
MCP client  --stdio-->  figma-agent-mcp
                           |  HTTP :PORT  /ping  /files  /rpc
                           |  WS   :PORT  /ws?fileKey=&fileName=
                           v
                     Figma plugin UI (WebSocket client)
                           |  postMessage
                           v
                     Figma plugin main (Plugin API)
```

Default `PORT` comes from repo-root **`bridge.config.json`** (`defaultPort`, synced into MCP + plugin UI + `manifest.json` on build).  
Optional MCP-only override: `FIGMA_AGENT_MCP_PORT` (must match the port baked into the plugin).

## Serialization (MessagePack)

Bridge **WebSocket** frames and leader↔follower **`POST /rpc`** bodies use **MessagePack** (`application/msgpack`) binary encoding via [`msgpackr`](https://github.com/kriszyp/msgpackr) with `useRecords: false` (standard map/array encoding).

| Channel | Encoding |
|---------|----------|
| `WS /ws` | Binary WebSocket frames (MsgPack) |
| `POST /rpc` | `Content-Type: application/msgpack` |
| `GET /ping`, `GET /files` | JSON (small health / discovery) |

### Why MsgPack

- PNG screenshots travel as **MsgPack `bin`** (`Uint8Array` / `Buffer`) — no base64 (~33% size tax)
- Large node trees pack denser than JSON and parse faster
- Same logical message shapes as before; only the wire format changed

### Screenshot payload

Plugin → MCP:

```js
{
  images: [
    { nodeId: "1:2", format: "png", data: Uint8Array /* raw PNG bytes */ }
  ]
}
```

- `save_screenshots` writes `data` buffers directly to disk
- `get_screenshot` MCP tool result converts `data` to **base64 strings** for agent-facing text output (`encoding: "base64"`)

## Roles

Multiple MCP processes may start (one per agent window). They elect a **leader**:

| Role | Responsibility |
|------|----------------|
| Leader | Binds the port, accepts plugin WebSockets, serves `/ping`, `/files`, and `/rpc` |
| Follower | Forwards tool calls to the leader via `POST /rpc` (MsgPack); lists files via `GET /files` |

If the leader dies, a follower attempts takeover.

## Plugin WebSocket

### Connect

```text
ws://localhost:1998/ws?fileKey=<FILE_KEY>&fileName=<ENCODED_NAME>
```

- `fileKey` is required (Figma `figma.fileKey`, or a local fallback for unsaved files).
- One active socket per `fileKey` (new connection replaces the old one).
- Clients must set `binaryType = "arraybuffer"`.

### Heartbeat

Leader sends a MsgPack control object roughly every 30s:

```js
{ type: "ping" }
```

The plugin must reply (also MsgPack binary):

```js
{ type: "pong" }
```

These frames have **no `requestId`** and must not be forwarded as tool RPC.  
If a connection misses two heartbeat rounds, the leader closes it (`4002 heartbeat timeout`).

### Request (MCP → plugin)

MsgPack-decoded object:

```js
{
  type: "get_selection",
  requestId: "unique-id",
  nodeIds: ["1:2"],
  params: {}
}
```

The plugin UI forwards this to the main thread as a `server-request` message (`tool` is accepted as an alias of `type` on the wire).

### Response (plugin → MCP)

```js
{
  requestId: "unique-id",
  ok: true,
  data: { /* may contain Uint8Array bins */ }
}
```

On failure:

```js
{
  requestId: "unique-id",
  ok: false,
  error: "message"
}
```

Requests time out after **180 seconds** on the MCP side.

## HTTP (followers / health)

### `GET /ping`

```json
{ "ok": true, "role": "leader" }
```

### `GET /files`

```json
{
  "ok": true,
  "files": [{ "fileKey": "…", "fileName": "…" }]
}
```

### `POST /rpc`

Request headers:

```http
Content-Type: application/msgpack
Accept: application/msgpack
```

Body (MsgPack of):

```js
{
  tool: "get_node",
  nodeIds: ["1:2"],
  params: {},
  fileKey: "optional-when-multiple-files"
}
```

Response: MsgPack of `{ ok: true, data }` or `{ ok: false, error }`.

## File routing

When several Figma files have the plugin connected, pass `fileKey` in tool arguments so the leader can pick the correct WebSocket. `list_files` returns the current map (from the leader, or via `/files` for followers).

## Stability notes

- Do not log MCP protocol messages to **stdout** (reserved for stdio MCP).
- Prefer Figma Desktop; browser tabs may sleep and drop the socket.
- Save the file when possible so `fileKey` stays stable.
- Plugin and MCP must be upgraded together — MsgPack binary is required on the bridge path.
