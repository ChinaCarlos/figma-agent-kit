# Bridge protocol

This document describes how **figma-agent-mcp** talks to **figma-agent-plugin**. All traffic is on localhost.

## Overview

```text
MCP client  --stdio-->  figma-agent-mcp
                           |  HTTP :PORT  /ping  /rpc
                           |  WS   :PORT  /ws?fileKey=&fileName=
                           v
                     Figma plugin UI (WebSocket client)
                           |  postMessage
                           v
                     Figma plugin main (Plugin API)
```

Default `PORT` = `1998`. Override with `FIGMA_AGENT_MCP_PORT`.

## Roles

Multiple MCP processes may start (one per agent window). They elect a **leader**:

| Role | Responsibility |
|------|----------------|
| Leader | Binds the port, accepts plugin WebSockets, serves `/ping` and `/rpc` |
| Follower | Forwards tool calls to the leader via `POST /rpc` |

If the leader dies, a follower attempts takeover.

## Plugin WebSocket

### Connect

```text
ws://localhost:1998/ws?fileKey=<FILE_KEY>&fileName=<ENCODED_NAME>
```

- `fileKey` is required (Figma `figma.fileKey`, or a local fallback for unsaved files).
- One active socket per `fileKey` (new connection replaces the old one).

### Heartbeat

Leader sends WebSocket `ping` roughly every 30s; plugin must answer `pong`. Dead connections are dropped.

### Request (MCP → plugin)

JSON text frame:

```json
{
  "type": "get_selection",
  "requestId": "unique-id",
  "nodeIds": ["1:2"],
  "params": {}
}
```

The plugin UI forwards this to the main thread as:

```json
{
  "type": "server-request",
  "payload": { "type": "get_selection", "requestId": "unique-id", "nodeIds": ["1:2"], "params": {} }
}
```

### Response (plugin → MCP)

```json
{
  "type": "get_selection",
  "requestId": "unique-id",
  "data": { },
  "error": null
}
```

On failure, set `error` to a string and omit or null `data`. Requests time out after **180 seconds** on the MCP side.

## HTTP (followers / health)

### `GET /ping`

```json
{ "ok": true, "role": "leader" }
```

### `POST /rpc`

Body:

```json
{
  "tool": "get_node",
  "nodeIds": ["1:2"],
  "params": {},
  "fileKey": "optional-when-multiple-files"
}
```

Response:

```json
{ "data": { }, "error": null }
```

## File routing

When several Figma files have the plugin connected, pass `fileKey` in tool arguments so the leader can pick the correct WebSocket. `list_files` returns the current map.

## Stability notes

- Do not log MCP protocol messages to **stdout** (reserved for stdio MCP).
- Prefer Figma Desktop; browser tabs may sleep and drop the socket.
- Save the file when possible so `fileKey` stays stable.
