import { z } from "zod";

export const fileKeySchema = z.string().optional();
export const nodeIdsSchema = z.array(z.string()).optional();

export const listFilesSchema = z.object({
  fileKey: fileKeySchema,
});

export const saveScreenshotsSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: nodeIdsSchema,
  path: z.string().optional(),
  compress: z.boolean().optional(),
});

export const getDocumentSchema = z.object({
  fileKey: fileKeySchema,
});

export const getSelectionSchema = z.object({
  fileKey: fileKeySchema,
});

export const getNodeSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
});

export const getStylesSchema = z.object({
  fileKey: fileKeySchema,
});

export const getMetadataSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: nodeIdsSchema,
});

export const getDesignContextSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: nodeIdsSchema,
});

export const getVariableDefsSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: nodeIdsSchema,
});

export const getScreenshotSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: nodeIdsSchema,
});

export const setNodeVisibilitySchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  visible: z.boolean(),
});

export const setTextContentSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  text: z.string(),
});

export const setTextPropertiesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  properties: z.record(z.unknown()),
});

export const setNodePropertiesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  properties: z.record(z.unknown()),
});

export const setSolidFillSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  color: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
    a: z.number().optional(),
  }),
});

export const setGradientFillSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  gradient: z.record(z.unknown()),
});

export const setEffectsSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  effects: z.array(z.record(z.unknown())),
});

export const setStrokePropertiesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  properties: z.record(z.unknown()),
});

export const setAutoLayoutSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  properties: z.record(z.unknown()),
});

export const createFrameSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const createTextSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  text: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const createShapeSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  shapeType: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const createImageSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  imageData: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const duplicateNodesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
});

export const reparentNodesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  parentId: z.string(),
});

export const groupNodesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  name: z.string().optional(),
});

export const ungroupNodeSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
});

export const setSelectionSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()),
});

export const scrollAndZoomIntoViewSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
});

export const deleteNodesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
});

export const genericForwardSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: nodeIdsSchema,
}).passthrough();
