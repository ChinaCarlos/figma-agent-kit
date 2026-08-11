# MCP tools

Tools exposed by **figma-agent-mcp**. Unless noted, calls are forwarded to the open Figma plugin over the bridge.

Optional common argument: `fileKey` — select which connected file to use.

Many write tools accept either **flat** fields (`name`, `x`, `visible`, …) or a nested `properties` object (merged into flat params on the plugin side).

When `nodeIds` is omitted for screenshot / metadata / design context / zoom, the plugin falls back to the **current selection**.

## Meta

| Tool | Description |
|------|-------------|
| `list_files` | List Figma files currently connected to the bridge (works on leader and follower) |
| `save_screenshots` | Export nodes to disk. PNG defaults to TinyPNG-style compression (`compress=true`). `scale` default **2**; use **`scale=3`** for slice assets matching the plugin UI export. Supports `format`: PNG / SVG / JPG / PDF, optional `clip` |

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
| `get_screenshot` | Raster/vector export; wire uses raw bytes (MsgPack bin), agent result is base64. Default `format=PNG`, `scale=2`. Uncompressed — prefer `save_screenshots` for compressed slices |

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

## Motion (Figma Motion API beta)

Requires a Figma build that exposes `figma.motion` / `applyAnimationStyle` on nodes. Otherwise tools return a clear capability error.

| Tool | Description |
|------|-------------|
| `get_motion_styles` | List available animation styles |
| `get_node_motion` | Read node animation styles, keyframes, timelines |
| `apply_animation_style` | Apply style (`styleId`, optional `animationStyleData`) |
| `remove_animation_style` | Remove one style or all (`animationStyleId` optional) |
| `apply_manual_keyframe_track` | Write a manual keyframe track (`field`, `track`) |
| `remove_manual_keyframe_track` | Remove a manual keyframe track (`field`) |
| `set_timeline_duration` | Set timeline duration (`timelineId`, `duration`) |

## Example agent flow

1. `list_files`  
2. `get_selection`  
3. `get_screenshot` on the selected frame (preview)  
4. `save_screenshots` with `scale: 3`, `compress: true` for delivery slices  
5. `set_text_content` / `set_node_properties` to apply edits  
