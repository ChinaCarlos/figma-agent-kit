import { z } from "zod";

export const fileKeySchema = z.string().optional();
export const nodeIdsSchema = z.array(z.string()).optional();

/** Nested bag kept for agents that already send `properties: { … }`. */
const propertiesBag = z.record(z.unknown()).optional();

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
  depth: z.number().int().min(0).max(20).optional(),
});

export const getSelectionSchema = z.object({
  fileKey: fileKeySchema,
});

export const getNodeSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  depth: z.number().int().min(0).max(20).optional(),
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
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontStyle: z.string().optional(),
  letterSpacing: z.number().optional(),
  lineHeight: z.union([z.number(), z.record(z.unknown())]).optional(),
  textAlignHorizontal: z.string().optional(),
  textAlignVertical: z.string().optional(),
  properties: propertiesBag,
});

export const setNodePropertiesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  name: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  opacity: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  rotation: z.number().optional(),
  properties: propertiesBag,
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
  gradientType: z
    .enum(["GRADIENT_LINEAR", "GRADIENT_RADIAL", "GRADIENT_ANGULAR", "GRADIENT_DIAMOND"])
    .optional(),
  gradientStops: z
    .array(
      z.object({
        position: z.number(),
        color: z.object({
          r: z.number(),
          g: z.number(),
          b: z.number(),
          a: z.number().optional(),
        }),
      }),
    )
    .optional(),
  gradient: z.record(z.unknown()).optional(),
});

export const setEffectsSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  effects: z.array(z.record(z.unknown())),
});

export const setStrokePropertiesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  strokeWeight: z.number().optional(),
  strokeAlign: z.enum(["INSIDE", "OUTSIDE", "CENTER"]).optional(),
  color: z
    .object({
      r: z.number(),
      g: z.number(),
      b: z.number(),
      a: z.number().optional(),
    })
    .optional(),
  properties: propertiesBag,
});

export const setAutoLayoutSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  layoutMode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).optional(),
  paddingLeft: z.number().optional(),
  paddingRight: z.number().optional(),
  paddingTop: z.number().optional(),
  paddingBottom: z.number().optional(),
  itemSpacing: z.number().optional(),
  primaryAxisAlignItems: z.string().optional(),
  counterAxisAlignItems: z.string().optional(),
  layoutWrap: z.enum(["NO_WRAP", "WRAP"]).optional(),
  properties: propertiesBag,
});

export const createFrameSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  name: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  properties: propertiesBag,
});

export const createTextSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  text: z.string().optional(),
  name: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  fontFamily: z.string().optional(),
  fontStyle: z.string().optional(),
  fontSize: z.number().optional(),
  properties: propertiesBag,
});

export const createShapeSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  shapeType: z
    .enum(["RECTANGLE", "ELLIPSE", "LINE", "POLYGON", "STAR"])
    .optional(),
  name: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  properties: propertiesBag,
});

export const createImageSchema = z.object({
  fileKey: fileKeySchema,
  parentId: z.string().optional(),
  imageData: z.string().optional(),
  name: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  properties: propertiesBag,
});

export const duplicateNodesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
});

export const reparentNodesSchema = z.object({
  fileKey: fileKeySchema,
  nodeIds: z.array(z.string()).min(1),
  parentId: z.string(),
  index: z.number().int().optional(),
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

export const genericForwardSchema = z
  .object({
    fileKey: fileKeySchema,
    nodeIds: nodeIdsSchema,
  })
  .passthrough();
