# Changelog

All notable changes to the **Figma Agent Kit** plugin are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

### Changed

### Fixed

## [0.1.3] - 2026-08-11

### Added

- Motion bridge handlers for the seven Motion MCP tools
- `get_screenshot` support for `format`, `scale` (default 2), and `clip`

### Fixed

- MsgPack codec inject in Rsbuild (`String.replace` with `$&` from minified msgpackr)
- Node resolution under `documentAccess: "dynamic-page"` using `figma.getNodeByIdAsync`

## [0.1.2] - 2026-08-11

### Added

- Slice export UI: 1× preview thumbs, 3× PNG download, ZIP via JSZip
- Chinese / English i18n (`locales.json`)
- Language switch in the settings (⚙) menu

### Changed

- Moved language preference out of model settings into the settings dropdown

## [0.1.1] - 2026-08-11

### Changed

- Version alignment with MCP for CI publish testing

## [0.1.0] - 2026-08-11

### Added

- Initial open-source plugin release
- Local MCP bridge client (MessagePack WebSocket)
- AI layer rename and visual grouping (OpenAI-compatible)
- Settings, Mini mode, and GitHub `version.json` update check

[Unreleased]: https://github.com/ChinaCarlos/figma-agent-kit/compare/figma-agent-plugin-v0.1.3...HEAD
[0.1.3]: https://github.com/ChinaCarlos/figma-agent-kit/releases/tag/figma-agent-plugin-v0.1.3
[0.1.2]: https://github.com/ChinaCarlos/figma-agent-kit/releases/tag/figma-agent-plugin-v0.1.2
[0.1.1]: https://github.com/ChinaCarlos/figma-agent-kit/releases/tag/figma-agent-plugin-v0.1.1
[0.1.0]: https://github.com/ChinaCarlos/figma-agent-kit/releases/tag/figma-agent-plugin-v0.1.0
