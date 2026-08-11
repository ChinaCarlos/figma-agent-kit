# MCP tools

Tools exposed by **figma-agent-mcp**. Unless noted, calls are forwarded to the open Figma plugin over the bridge.

Optional common argument: `fileKey` — select which connected file to use.

## Meta

| Tool | Description |
|------|-------------|
| `list_files` | List Figma files currently connected to the bridge |
| `save_screenshots` | Call `get_screenshot` and write PNG files to disk (optional compress) |

## Read

| Tool | Description |
|------|-------------|
| `get_document` | Document / page overview |
| `get_selection` | Current selection |
| `get_node` | Serialize node(s) by id |
| `get_styles` | Local styles (best effort) |
| `get_metadata` | File / page metadata |
| `get_design_context` | Lightweight design context for agents |
| `get_variable_defs` | Variables (best effort) |
| `get_screenshot` | Raster export (PNG) of node(s) |

## Write / mutate

| Tool | Description |
|------|-------------|
| `set_node_visibility` | Show / hide nodes |
| `set_text_content` | Set text characters |
| `set_text_properties` | Font / size / etc. when supported |
| `set_node_properties` | Name, position, opacity, etc. |
| `set_solid_fill` | Solid paint |
| `set_gradient_fill` | Gradient paint |
| `set_effects` | Shadows / blurs |
| `set_stroke_properties` | Stroke |
| `set_auto_layout` | Auto-layout props |
| `create_frame` | Create a frame |
| `create_text` | Create a text node |
| `create_shape` | Create a shape |
| `create_image` | Create an image node (when supported) |
| `duplicate_nodes` | Duplicate |
| `reparent_nodes` | Move in hierarchy |
| `group_nodes` | Group |
| `ungroup_node` | Ungroup |
| `set_selection` | Change selection |
| `scroll_and_zoom_into_view` | Focus viewport |
| `delete_nodes` | Delete nodes |

## Not in v0.1

Motion / animation style APIs are intentionally omitted. They can be added in a later release without changing the bridge transport.

## Example agent flow

1. `list_files`  
2. `get_selection`  
3. `get_screenshot` on the selected frame  
4. Reason about the UI  
5. `set_text_content` / `set_node_properties` to apply edits  
