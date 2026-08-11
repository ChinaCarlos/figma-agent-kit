import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Node } from "./node.js";
import { compressPng } from "./compress-png.js";
import * as schemas from "./schema.js";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
};

function textResult(data: unknown): ToolResult {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

function forwardTool(
  node: Node,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const { fileKey, nodeIds, ...rest } = args;
  const params =
    Object.keys(rest).length > 0 ? (rest as Record<string, unknown>) : undefined;
  return node.send(
    toolName,
    nodeIds as string[] | undefined,
    params,
    fileKey as string | undefined,
  );
}

export function registerTools(
  server: McpServer,
  node: Node,
  port: number,
): void {
  server.registerTool(
    "list_files",
    {
      description: "List Figma files currently connected via the plugin bridge.",
      inputSchema: z.object({}),
    },
    async () => {
      const files = node.listFiles();
      return textResult(files);
    },
  );

  server.registerTool(
    "save_screenshots",
    {
      description: "Capture screenshots of nodes and save them to disk.",
      inputSchema: schemas.saveScreenshotsSchema,
    },
    async (args) => {
      const outDir = args.path ?? join(process.cwd(), "screenshots");
      await mkdir(outDir, { recursive: true });

      const screenshots = (await forwardTool(node, "get_screenshot", {
        fileKey: args.fileKey,
        nodeIds: args.nodeIds,
      })) as Array<{ nodeId: string; data: string }> | Record<string, string>;

      const entries: Array<{ nodeId: string; data: string }> = [];

      if (Array.isArray(screenshots)) {
        entries.push(...screenshots);
      } else if (screenshots && typeof screenshots === "object") {
        for (const [nodeId, data] of Object.entries(screenshots)) {
          entries.push({ nodeId, data });
        }
      }

      const saved: string[] = [];
      for (const entry of entries) {
        const base64 = entry.data.replace(/^data:image\/png;base64,/, "");
        const rawBuffer = Buffer.from(base64, "base64");
        const fileBuffer = args.compress
          ? await compressPng(rawBuffer)
          : rawBuffer;
        const filePath = join(outDir, `${entry.nodeId}.png`);
        await writeFile(filePath, fileBuffer);
        saved.push(filePath);
      }

      return textResult({ saved, count: saved.length, directory: outDir });
    },
  );

  const bridgeTools: Array<{
    name: string;
    description: string;
    inputSchema: z.ZodObject<z.ZodRawShape>;
  }> = [
    {
      name: "get_document",
      description: "Get the full Figma document tree.",
      inputSchema: schemas.getDocumentSchema,
    },
    {
      name: "get_selection",
      description: "Get the current selection in Figma.",
      inputSchema: schemas.getSelectionSchema,
    },
    {
      name: "get_node",
      description: "Get details for specific nodes.",
      inputSchema: schemas.getNodeSchema,
    },
    {
      name: "get_styles",
      description: "Get local styles from the Figma file.",
      inputSchema: schemas.getStylesSchema,
    },
    {
      name: "get_metadata",
      description: "Get lightweight metadata for nodes.",
      inputSchema: schemas.getMetadataSchema,
    },
    {
      name: "get_design_context",
      description: "Get design context for nodes (layout, styles, content).",
      inputSchema: schemas.getDesignContextSchema,
    },
    {
      name: "get_variable_defs",
      description: "Get variable definitions used by nodes.",
      inputSchema: schemas.getVariableDefsSchema,
    },
    {
      name: "get_screenshot",
      description: "Capture PNG screenshots of nodes (returns base64).",
      inputSchema: schemas.getScreenshotSchema,
    },
    {
      name: "set_node_visibility",
      description: "Set visibility of nodes.",
      inputSchema: schemas.setNodeVisibilitySchema,
    },
    {
      name: "set_text_content",
      description: "Set text content of text nodes.",
      inputSchema: schemas.setTextContentSchema,
    },
    {
      name: "set_text_properties",
      description: "Set text properties on text nodes.",
      inputSchema: schemas.setTextPropertiesSchema,
    },
    {
      name: "set_node_properties",
      description: "Set generic properties on nodes.",
      inputSchema: schemas.setNodePropertiesSchema,
    },
    {
      name: "set_solid_fill",
      description: "Set a solid fill color on nodes.",
      inputSchema: schemas.setSolidFillSchema,
    },
    {
      name: "set_gradient_fill",
      description: "Set a gradient fill on nodes.",
      inputSchema: schemas.setGradientFillSchema,
    },
    {
      name: "set_effects",
      description: "Set effects on nodes.",
      inputSchema: schemas.setEffectsSchema,
    },
    {
      name: "set_stroke_properties",
      description: "Set stroke properties on nodes.",
      inputSchema: schemas.setStrokePropertiesSchema,
    },
    {
      name: "set_auto_layout",
      description: "Set auto-layout properties on frames.",
      inputSchema: schemas.setAutoLayoutSchema,
    },
    {
      name: "create_frame",
      description: "Create a new frame.",
      inputSchema: schemas.createFrameSchema,
    },
    {
      name: "create_text",
      description: "Create a new text node.",
      inputSchema: schemas.createTextSchema,
    },
    {
      name: "create_shape",
      description: "Create a new shape node.",
      inputSchema: schemas.createShapeSchema,
    },
    {
      name: "create_image",
      description: "Create a new image node.",
      inputSchema: schemas.createImageSchema,
    },
    {
      name: "duplicate_nodes",
      description: "Duplicate nodes.",
      inputSchema: schemas.duplicateNodesSchema,
    },
    {
      name: "reparent_nodes",
      description: "Move nodes to a new parent.",
      inputSchema: schemas.reparentNodesSchema,
    },
    {
      name: "group_nodes",
      description: "Group nodes together.",
      inputSchema: schemas.groupNodesSchema,
    },
    {
      name: "ungroup_node",
      description: "Ungroup a group node.",
      inputSchema: schemas.ungroupNodeSchema,
    },
    {
      name: "set_selection",
      description: "Set the current selection in Figma.",
      inputSchema: schemas.setSelectionSchema,
    },
    {
      name: "scroll_and_zoom_into_view",
      description: "Scroll and zoom the viewport to show nodes.",
      inputSchema: schemas.scrollAndZoomIntoViewSchema,
    },
    {
      name: "delete_nodes",
      description: "Delete nodes.",
      inputSchema: schemas.deleteNodesSchema,
    },
  ];

  for (const tool of bridgeTools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        const data = await forwardTool(node, tool.name, args);
        return textResult(data);
      },
    );
  }

  console.error(
    `[tools] registered ${bridgeTools.length + 2} tools on port ${port}`,
  );
}
