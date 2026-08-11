# AI features

Figma Agent Kit includes optional **AI layer rename** and **visual grouping** workflows in the plugin UI. They use any **OpenAI-compatible** chat API with vision support.

## Setup

1. Open the plugin → **Settings**
2. Set **API base URL** (default `https://api.openai.com/v1`)
3. Set **Model** (default `gpt-4o`; `gpt-4o-mini` also works)
4. Paste your **API key**
5. Click **Test connection**, then **Save**

Credentials are stored in Figma `clientStorage` on your machine only.

### Custom AI providers

Figma plugins must declare allowed network domains in `manifest.json`. This repo includes:

- `https://api.openai.com` (default)
- `https://raw.githubusercontent.com` (version checks)

For other hosts (Azure OpenAI, local LiteLLM, etc.), add the API host to `networkAccess.allowedDomains` in `packages/figma-agent-plugin/manifest.json`, rebuild, and re-import the plugin.

## AI rename

1. Select a single **Frame** or **Group**
2. Open the **Rename** tab → **Start rename**
3. The plugin clones the selection to the right, exports a 1× PNG, and sends layer candidates + image to your API
4. Returned names are applied on the **clone** (original is untouched)

Skipped: `TEXT` nodes and very small layers (&lt; 2px).

## AI visual grouping

1. Select a single **Frame**, **Group**, or **Section**
2. Open the **Group** tab → **Start group**
3. Review/edit the JSON plan in the editor
4. Click **Apply groups** to create nested groups on the clone (depth-first)

The collector also suggests simple row-based proximity clusters as a hint to the model.

## How it works

```
Plugin main (Figma API)  ←→  Plugin UI  ←→  Your OpenAI-compatible API
     clone / collect              vision + JSON prompts
     apply names/groups
```

The MCP bridge does **not** require an API key. AI calls run only from the plugin UI when you use Rename or Group.

## Version updates

Updates are distributed via GitHub — edit `releases/version.json` on the `main` branch. The plugin fetches:

`https://raw.githubusercontent.com/ChinaCarlos/figma-agent-kit/main/releases/version.json`

No CDN or upload scripts are involved. See [getting-started.md](./getting-started.md#publishing-a-new-version).
