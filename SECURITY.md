# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes |
| &lt; 0.1  | No |

Please upgrade MCP (`figma-agent-mcp`) and the Figma plugin together.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security bugs.

Prefer one of:

1. [GitHub Security Advisories](https://github.com/ChinaCarlos/figma-agent-kit/security/advisories/new) for this repository (private report)
2. Email the maintainer via the address listed on the [GitHub profile](https://github.com/ChinaCarlos) if advisories are unavailable

Include:

- Affected package versions (MCP + plugin)
- Impact (e.g. unexpected network egress, path traversal in `save_screenshots`, privilege issues)
- Reproduction steps or a minimal PoC
- Whether a fix is already known

We aim to acknowledge reports within **7 days** and to publish a fix or mitigation as soon as practical.

## Threat model (summary)

- The MCP bridge listens on **localhost** only. Anyone who can open TCP on your machine can potentially call the bridge while the Leader is running and the plugin is connected.
- Optional plugin AI features send design screenshots and layer metadata to the **API base URL you configure**. API keys are stored in Figma `clientStorage`, not in this repository.
- `save_screenshots` writes to a path you (or the agent) supply — treat agent-controlled paths carefully on shared machines.

See also [docs/architecture.md](./docs/architecture.md) and [docs/ai-features.md](./docs/ai-features.md).
