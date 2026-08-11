# MCP tools

Tools exposed by **figma-agent-mcp**. Unless noted, calls are forwarded to the open Figma plugin over the bridge.

Optional common argument: `fileKey` — select which connected file to use.

Many write tools accept either **flat** fields (`name`, `x`, `visible`, …) or a nested `properties` object (merged into flat params on the plugin side).

When `nodeIds` is omitted for screenshot / metadata / design context / zoom, the plugin falls back to the **current selection**.

## Meta

| Tool | Description |
|------|-------------|
| `list_files` | List Figma files currently connected to the bridge (works on leader and follower) |
| `save_screenshots` | Call `get_screenshot` and write PNG files to disk (binary path, optional compress) |

## Read

| Tool | Description |
|------|-------------|
| `get_document` | Current page tree overview (`depth` optional) |
| `get_selection` | Current selection |
| `get_node` | Serialize node(s) by id (`depth` optional) |
| `get_styles` | Local paint / text / effect styles |
| `get_metadata` | Lightweight id/name/type/size |
| `get_design_context` | Serialized nodes for agent context |
| `get_variable_defs` | Local variable collections and variables |
| `get_screenshot` | Raster export of node(s); wire uses raw PNG bytes (MsgPack bin), agent result is base64 |

## Write / mutate

| Tool | Description |
|------|-------------|
| `set_node_visibility` | Show / hide nodes (`visible`) |
| `set_text_content` | Set text characters (`text`) |
| `set_text_properties` | Font size / family / style / align / spacing |
| `set_node_properties` | Name, position, size, opacity, rotation |
| `set_solid_fill` | Solid paint (`color: {r,g,b,a?}`, 0–1 or 0–255) |
| `set_gradient_fill` | Gradient fill (`gradientStops`, optional `gradientType`) |
| `set_effects` | Shadows / blurs (`effects` array) |
| `set_stroke_properties` | Stroke weight / align / color |
| `set_auto_layout` | Auto-layout on frames |
| `create_frame` | Create a frame |
| `create_text` | Create a text node |
| `create_shape` | Create `RECTANGLE` / `ELLIPSE` / `LINE` / `POLYGON` / `STAR` |
| `create_image` | Create a rectangle with image fill from base64 `imageData` |
| `duplicate_nodes` | Duplicate |
| `reparent_nodes` | Move in hierarchy (`parentId`, optional `index`) |
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
