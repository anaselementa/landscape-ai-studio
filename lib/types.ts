export type Project = {
  id: string;
  name: string;
  project_type: string | null;
  location: string | null;
  style: string | null;
  constraints: string | null;
  status: string | null;
  selected_idea_id?: string | null;
  created_at: string;
  updated_at: string | null;
};

export type SiteImage = {
  id: string;
  project_id: string;
  title: string | null;
  space_name: string | null;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type LandscapeAnalysis = {
  site_summary: string;
  climate_reading: string;
  photo_analyses: PhotoAnalysis[];
  existing_elements: string[];
  opportunities: string[];
  constraints_to_respect: string[];
  design_direction: string;
  recommended_next_steps: string[];
};

export type PhotoAnalysis = {
  photo_id?: string | null;
  photo_title?: string | null;
  image_url?: string | null;
  probable_space: string;
  visible_existing_elements: string[];
  visible_materials: string[];
  visible_vegetation: string[];
  possible_uses: string[];
  problems: string[];
  opportunities: string[];
  recommended_interventions: string[];
};

export type AnalysisRecord = {
  id: string;
  project_id: string;
  summary: string | null;
  analysis_json: LandscapeAnalysis;
  is_demo?: boolean | null;
  demo_reason?: string | null;
  created_at: string;
};

export type SwotPayload = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

export type SwotRecord = SwotPayload & {
  id: string;
  project_id: string;
  analysis_id: string | null;
  is_demo?: boolean | null;
  demo_reason?: string | null;
  created_at: string;
};

export type DesignIdea = {
  title: string;
  description: string;
  intervention_level: "light" | "medium" | "strong";
  spaces_concerned: string[];
  spatial_moves: string[];
  concept_keywords: string[];
  materials: string[];
  plants: string[];
  furniture: string[];
  lighting: string[];
  cost_level: string;
  maintenance_level: string;
  preserved_elements: string[];
  transformed_elements: string[];
};

export type IdeaRecord = DesignIdea & {
  id: string;
  project_id: string;
  analysis_id: string | null;
  status: string | null;
  selected?: boolean | null;
  is_demo?: boolean | null;
  demo_reason?: string | null;
  created_at: string;
};

export type BenchmarkReference = {
  title: string;
  image_url?: string | null;
  thumbnail_url?: string | null;
  source_url?: string | null;
  source_platform?: BenchmarkPlatform;
  image_query: string;
  justification: string;
  score: number;
  tags?: string[];
};

export type BenchmarkPlatform = "pinterest" | "serpapi_pinterest" | "bing_pinterest" | "fallback";

export type BenchmarkPayload = {
  summary: string;
  selected_idea_title?: string;
  references: BenchmarkReference[];
};

export type BenchmarkRecord = {
  id: string;
  project_id: string;
  analysis_id: string | null;
  selected_idea_id: string | null;
  summary: string | null;
  benchmark_json: BenchmarkPayload;
  is_demo?: boolean | null;
  demo_reason?: string | null;
  created_at: string;
};

export type BenchmarkResultRecord = {
  id: string;
  project_id: string;
  idea_id: string | null;
  title: string;
  source_platform: BenchmarkPlatform;
  image_url: string | null;
  thumbnail_url: string | null;
  source_url: string | null;
  image_query: string;
  justification: string;
  relevance_score: number;
  tags: string[];
  is_external: boolean;
  created_at: string;
};

export type BenchmarkQueryRecord = {
  id: string;
  project_id: string;
  idea_id: string | null;
  query: string;
  platform: BenchmarkPlatform;
  status: string;
  created_at: string;
};

export type PlanPayload = {
  plan_title: string;
  concept_svg: string;
  realistic_image_prompt: string;
  zones: string[];
  zone_proposals?: Array<{
    zone_name: string;
    texture: string;
    vegetation: string;
    material: string;
    furniture: string;
    lighting: string;
    intention: string;
    image_prompt: string;
  }>;
  materials: string[];
  planting: string[];
  material_legend: string[];
  planting_legend: string[];
  validation_notes: string[];
  non_metric_warning: string;
};

export type PlanRecord = {
  id: string;
  project_id: string;
  analysis_id: string | null;
  selected_idea_id: string | null;
  master_plan_id?: string | null;
  plan_json: PlanPayload;
  concept_svg: string | null;
  realistic_image_prompt: string | null;
  is_demo?: boolean | null;
  demo_reason?: string | null;
  created_at: string;
};

export type MasterPlanRecord = {
  id: string;
  project_id: string;
  title: string | null;
  file_url: string;
  storage_path: string;
  width: number | null;
  height: number | null;
  mime_type?: string | null;
  created_at: string;
};

export type PlanZoneRecord = {
  id: string;
  project_id: string;
  master_plan_id: string;
  name: string;
  zone_type: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  polygon: unknown;
  linked_site_image_id: string | null;
  linked_idea_id: string | null;
  linked_generated_image_url: string | null;
  notes: string | null;
  texture_instruction: string | null;
  created_at: string;
};

export type GeneratedSpaceImageRecord = {
  id: string;
  project_id: string;
  idea_id: string | null;
  site_image_id: string | null;
  zone_id: string | null;
  prompt: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
};
