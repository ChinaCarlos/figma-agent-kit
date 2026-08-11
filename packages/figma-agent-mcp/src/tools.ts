import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Node } from "./node.js";
import {
  calcPngSavedPct,
  compressPngLossless,
} from "./compress-png.js";
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

type ScreenshotBytes = Buffer | Uint8Array;

function isBinaryData(value: unknown): value is ScreenshotBytes {
  return Buffer.isBuffer(value) || value instanceof Uint8Array;
}

function toPngBuffer(data: string | ScreenshotBytes): Buffer {
  if (isBinaryData(data)) {
    return Buffer.isBuffer(data) ? data : Buffer.from(data);
  }
  const base64 = data.replace(/^data:image\/png;base64,/, "");
  return Buffer.from(base64, "base64");
}

/** Normalize get_screenshot payloads into a flat list of { nodeId, data }. */
function normalizeScreenshotEntries(
  payload: unknown,
): Array<{ nodeId: string; data: string | ScreenshotBytes }> {
  const entries: Array<{ nodeId: string; data: string | ScreenshotBytes }> = [];

  if (!payload || typeof payload !== "object") return entries;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const nodeId = (item as { nodeId?: unknown }).nodeId;
      const data = (item as { data?: unknown }).data;
      if (typeof nodeId !== "string") continue;
      if (typeof data === "string" || isBinaryData(data)) {
        entries.push({ nodeId, data });
      }
    }
    return entries;
  }

  const obj = payload as Record<string, unknown>;

  if (Array.isArray(obj.images)) {
    return normalizeScreenshotEntries(obj.images);
  }

  for (const [nodeId, data] of Object.entries(obj)) {
    if (typeof data === "string" || isBinaryData(data)) {
      entries.push({ nodeId, data });
    }
  }

  return entries;
}

/** Convert binary screenshot payloads to base64 for MCP text tool results. */
function screenshotPayloadForAgent(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;

  const convertList = (list: unknown[]): unknown[] =>
    list.map((item) => {
      if (!item || typeof item !== "object") return item;
      const row = item as Record<string, unknown>;
      if (!isBinaryData(row.data)) return item;
      return {
        ...row,
        data: Buffer.from(row.data).toString("base64"),
        encoding: "base64",
      };
    });

  if (Array.isArray(payload)) {
    return convertList(payload);
  }

  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.images)) {
    return { ...obj, images: convertList(obj.images) };
  }

  return payload;
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
      const files = await node.listFiles();
      return textResult(files);
    },
  );

  server.registerTool(
    "save_screenshots",
    {
      description:
        "Export screenshots/slices to the local filesystem. PNG defaults to TinyPNG-style compression (compress=true). Use scale=3 for slice assets matching the plugin export; default scale is 2.",
      inputSchema: schemas.saveScreenshotsSchema,
    },
    async (args) => {
      const outDir = args.path ?? join(process.cwd(), "screenshots");
      await mkdir(outDir, { recursive: true });
      const format = args.format ?? "PNG";
      const scale = args.scale ?? 2;
      const clip = args.clip === true;
      const compress =
        args.compress !== undefined ? args.compress : format === "PNG";

      const screenshots = await forwardTool(node, "get_screenshot", {
        fileKey: args.fileKey,
        nodeIds: args.nodeIds,
        format,
        scale,
        clip,
      });

      const entries = normalizeScreenshotEntries(screenshots);
      if (entries.length === 0) {
        return textResult({
          saved: [],
          count: 0,
          directory: outDir,
          error: "No screenshot data returned from plugin",
        });
      }

      const ext = format.toLowerCase();
      const files: Array<Record<string, unknown>> = [];
      const saved: string[] = [];

      for (const entry of entries) {
        const rawBuffer = toPngBuffer(entry.data);
        const before = rawBuffer.length;
        let fileBuffer: Buffer = rawBuffer;
        let compressed = false;
        let compressionMode: string | undefined;
        let compressionNote: string | undefined;
        let after = before;

        if (compress && format === "PNG") {
          const result = compressPngLossless(rawBuffer);
          fileBuffer = Buffer.from(result.bytes);
          after = result.after;
          compressed = result.mode === "compressed";
          compressionMode = result.mode;
          compressionNote = result.note;
        }

        const safeId = entry.nodeId.replace(/[^a-zA-Z0-9:_-]/g, "_");
        const filePath = join(outDir, `${safeId}.${ext}`);
        await writeFile(filePath, fileBuffer);
        saved.push(filePath);

        const savedPct =
          format === "PNG" && compress
            ? calcPngSavedPct(before, after)
            : 0;
        files.push({
          nodeId: entry.nodeId,
          path: filePath,
          format,
          scale,
          bytesBefore: before,
          bytesAfter: after,
          savedPct,
          compressed,
          compressionMode,
          compressionNote,
          summary:
            format === "PNG" && compress
              ? compressed
                ? `${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB（节省 ${savedPct}%${compressionNote ? ` · ${compressionNote}` : ""}）`
                : `${(after / 1024).toFixed(1)} KB · 未压缩（${compressionNote || compressionMode || "保留原图"}）`
              : `${(after / 1024).toFixed(1)} KB · ${format}`,
        });
      }

      return textResult({
        saved,
        files,
        count: saved.length,
        directory: outDir,
        format,
        scale,
        compress,
      });
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
      description:
        "Capture node screenshots (returns base64). Default format PNG, scale 2. Uncompressed — use save_screenshots for TinyPNG-style compression / scale=3 slices.",
      inputSchema: schemas.getScreenshotSchema,
    },
    {
      name: "get_motion_styles",
      description: "List available Figma motion/animation styles.",
      inputSchema: schemas.getMotionStylesSchema,
    },
    {
      name: "get_node_motion",
      description:
        "Get motion properties for a node (animation styles, keyframes, timelines).",
      inputSchema: schemas.getNodeMotionSchema,
    },
    {
      name: "apply_animation_style",
      description: "Apply an animation style to a node.",
      inputSchema: schemas.applyAnimationStyleSchema,
    },
    {
      name: "remove_animation_style",
      description:
        "Remove an animation style from a node (or all styles if animationStyleId omitted).",
      inputSchema: schemas.removeAnimationStyleSchema,
    },
    {
      name: "apply_manual_keyframe_track",
      description: "Apply a manual keyframe track to a node property.",
      inputSchema: schemas.applyManualKeyframeTrackSchema,
    },
    {
      name: "remove_manual_keyframe_track",
      description: "Remove a manual keyframe track from a node property.",
      inputSchema: schemas.removeManualKeyframeTrackSchema,
    },
    {
      name: "set_timeline_duration",
      description: "Set the duration of a node timeline.",
      inputSchema: schemas.setTimelineDurationSchema,
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
        const forAgent =
          tool.name === "get_screenshot"
            ? screenshotPayloadForAgent(data)
            : data;
        return textResult(forAgent);
      },
    );
  }

  console.error(
    `[tools] registered ${bridgeTools.length + 2} tools on port ${port}`,
  );
}
