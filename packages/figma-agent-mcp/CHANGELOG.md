# Changelog

All notable changes to **figma-agent-mcp** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- First stable **1.0.0** kit release (MCP + plugin versions locked)
- Public bilingual docs site: https://chinacarlos.github.io/figma-agent-kit/

### Changed

- Promoted from 0.1.x preview line to stable 1.0.0

### Fixed

## [0.1.3] - 2026-08-11

### Added

- Seven Motion MCP tools: `get_motion_styles`, `get_node_motion`, `apply_animation_style`, `remove_animation_style`, `apply_manual_keyframe_track`, `remove_manual_keyframe_track`, `set_timeline_duration`
- `save_screenshots` options: `scale`, `format` (PNG/SVG/JPG/PDF), `clip`, TinyPNG-style PNG compression (`compress`, default on for PNG)
- GitHub Packages publish path for scoped `@owner/figma-agent-mcp`

### Changed

- Tool surface expanded to **37** tools (parity with companion plugin bridge handlers)
- Default raster export scale remains **2**; document `scale=3` for slice parity with the plugin UI

### Fixed

- MessagePack codec injection for the companion plugin path (string `replace` corrupting `$&` in minified bundles)
- Reliable node lookup under `documentAccess: "dynamic-page"` via async `getNodeByIdAsync` on the plugin side

## [0.1.2] - 2026-08-11

### Changed

- Version alignment with plugin slice-export / i18n release (no MCP tool surface change required for that UI work)

## [0.1.1] - 2026-08-11

### Changed

- CI / publish dry-run alignment; keep MCP and plugin on the same semver line

## [0.1.0] - 2026-08-11

### Added

- Initial open-source release
- Local MCP bridge (WebSocket + Leader/Follower election)
- MessagePack binary framing for bridge RPC and screenshot bytes
- Core read/write Figma tools via the companion plugin
- `list_files` and `save_screenshots` local MCP tools

[Unreleased]: https://github.com/ChinaCarlos/figma-agent-kit/compare/figma-agent-mcp-v0.1.3...HEAD
[0.1.3]: https://www.npmjs.com/package/figma-agent-mcp/v/0.1.3
[0.1.2]: https://www.npmjs.com/package/figma-agent-mcp/v/0.1.2
[0.1.1]: https://www.npmjs.com/package/figma-agent-mcp/v/0.1.1
[0.1.0]: https://www.npmjs.com/package/figma-agent-mcp/v/0.1.0
