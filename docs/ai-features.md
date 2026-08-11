# AI features

Figma Agent Kit includes optional **AI layer rename** and **visual grouping** workflows in the plugin UI. They use any **OpenAI-compatible** chat API with vision support.

## Setup

1. Open the plugin → ⚙ → choose UI language (**中文** / **English**) in the menu if needed
2. ⚙ → **模型设置** → set **API base URL** (default `https://api.openai.com/v1`)
3. Set **Model** (default `gpt-4o`; `gpt-4o-mini` also works)
4. Paste your **API key**
5. Click **Test connection**, then **Save**

Credentials and language preference are stored in Figma `clientStorage` on your machine only. UI copy lives in `packages/figma-agent-plugin/src/ui/locales.json`.

### Prompt templates

⚙ → **提示词设置** 可分别编辑「图层重命名」「视觉分组」系统提示词。

- 默认模板在 `packages/figma-agent-plugin/src/prompts/*.prompt.txt`，构建时注入 UI
- 支持占位符：`{{candidates}}`、`{{suggestedClusters}}`（分组）
- **恢复默认** 会载入仓库默认文案；**保存提示词** 后写入本地 `clientStorage`（仅覆盖有改动的项）

### Custom AI providers

Figma plugins must declare allowed network domains in `manifest.json`. This repo already allowlists common OpenAI-compatible hosts, including:

- `https://api.openai.com`（默认）
- `https://dashscope.aliyuncs.com` / `https://dashscope-intl.aliyuncs.com`（通义 / 百炼）
- `https://api.deepseek.com`
- `https://api.moonshot.cn`
- `https://api.siliconflow.cn`
- `https://open.bigmodel.cn`（智谱）
- `https://ark.cn-beijing.volces.com`（火山方舟）
- `https://openrouter.ai`、`https://api.groq.com`、`https://api.together.xyz`
- `http://localhost`（本地代理）
- `https://raw.githubusercontent.com`（版本检查）

若使用 Azure OpenAI 等自定义域名，把对应 host 加进 `packages/figma-agent-plugin/manifest.json` → `networkAccess.allowedDomains`，重建并重新 Import 插件。

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
