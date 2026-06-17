export type Project = {
  id: string;
  name: string;
  project_type: string | null;
  location: string | null;
  style: string | null;
  constraints: string | null;
  status: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type SiteImage = {
  id: string;
  project_id: string;
  title: string | null;
  space_name: string | null;
  storage_path: string | null;
  public_url: string | null;
  image_url?: string | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type AnalysisRecord = {
  id: string;
  project_id: string;
  image_id: string | null;
  summary: string | null;
  analysis_json: any;
  analysis?: any;
  created_at: string;
};

export type SwotRecord = {
  id: string;
  project_id: string;
  analysis_id: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  opportunities: string[] | null;
  threats: string[] | null;
  summary: string | null;
  created_at: string;
};

export type ReferenceRecord = {
  id: string;
  project_id: string;
  analysis_id: string | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  image_query: string | null;
  reason: string | null;
  created_at: string;
};

export type IdeaRecord = {
  id: string;
  project_id: string;
  analysis_id: string | null;
  title: string;
  description: string;
  intervention_level: string | null;
  materials: string[] | null;
  plants: string[] | null;
  furniture: string[] | null;
  lighting: string[] | null;
  cost_level: string | null;
  maintenance_level: string | null;
  selected: boolean | null;
  status: string | null;
  created_at: string;
};

export type MasterPlan = {
  id: string;
  project_id: string;
  title: string | null;
  file_name: string | null;
  storage_path: string | null;
  public_url: string | null;
  created_at: string;
};

export type PlanZone = {
  id: string;
  project_id: string;
  master_plan_id: string | null;
  name: string;
  description: string | null;
  site_image_id: string | null;
  idea_id: string | null;
  status: string | null;
  created_at: string;
};

export type PlanRender = {
  id: string;
  project_id: string;
  master_plan_id: string | null;
  render_type: string;
  title: string;
  summary: string | null;
  render_json: any;
  status: string | null;
  created_at: string;
};

export type ValidationRecord = {
  id: string;
  project_id: string;
  status: string;
  notes: string | null;
  created_at: string;
};
