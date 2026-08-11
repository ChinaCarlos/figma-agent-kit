export interface BridgeRequest {
  requestId: string;
  tool: string;
  nodeIds?: string[];
  params?: Record<string, unknown>;
}

export interface BridgeResponse {
  requestId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export type BridgeToolName =
  | "get_document"
  | "get_selection"
  | "get_node"
  | "get_metadata"
  | "get_design_context"
  | "get_screenshot"
  | "set_node_visibility"
  | "set_text_content"
  | "set_text_properties"
  | "set_node_properties"
  | "set_solid_fill"
  | "set_gradient_fill"
  | "set_effects"
  | "set_stroke_properties"
  | "set_auto_layout"
  | "create_frame"
  | "create_text"
  | "create_shape"
  | "create_image"
  | "group_nodes"
  | "ungroup_node"
  | "duplicate_nodes"
  | "reparent_nodes"
  | "set_selection"
  | "scroll_and_zoom_into_view"
  | "delete_nodes"
  | "get_styles"
  | "get_variable_defs"
  | "get_motion_styles"
  | "get_node_motion"
  | "apply_animation_style"
  | "remove_animation_style"
  | "apply_manual_keyframe_track"
  | "remove_manual_keyframe_track"
  | "set_timeline_duration";

export const CORE_BRIDGE_TOOLS: readonly BridgeToolName[] = [
  "get_document",
  "get_selection",
  "get_node",
  "get_metadata",
  "get_design_context",
  "get_screenshot",
  "set_node_visibility",
  "set_text_content",
  "set_text_properties",
  "set_node_properties",
  "set_solid_fill",
  "set_gradient_fill",
  "set_effects",
  "set_stroke_properties",
  "set_auto_layout",
  "create_frame",
  "create_text",
  "create_shape",
  "create_image",
  "group_nodes",
  "ungroup_node",
  "duplicate_nodes",
  "reparent_nodes",
  "set_selection",
  "scroll_and_zoom_into_view",
  "delete_nodes",
  "get_styles",
  "get_variable_defs",
  "get_motion_styles",
  "get_node_motion",
  "apply_animation_style",
  "remove_animation_style",
  "apply_manual_keyframe_track",
  "remove_manual_keyframe_track",
  "set_timeline_duration",
] as const;
