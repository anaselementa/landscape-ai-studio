export type Project = {
  id: string;
  name: string;
  project_type: string | null;
  location: string | null;
  style: string | null;
  constraints: string | null;
  status: string | null;
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
  space_type: string;
  objective_description: string;
  existing_elements: string[];
  landscape_diagnosis: string;
  elements_to_keep: string[];
  elements_to_improve: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  design_direction: string;
};

export type AnalysisRecord = {
  id: string;
  project_id: string;
  summary: string | null;
  analysis_json: LandscapeAnalysis;
  created_at: string;
};

export type SwotRecord = {
  id: string;
  project_id: string;
  analysis_id: string | null;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  created_at: string;
};

export type DesignIdea = {
  title: string;
  description: string;
  intervention_level: "light" | "medium" | "strong";
  materials: string[];
  plants: string[];
  furniture: string[];
  lighting: string[];
  cost_level: string;
  maintenance_level: string;
};

export type IdeaRecord = DesignIdea & {
  id: string;
  project_id: string;
  analysis_id: string | null;
  status: string | null;
  created_at: string;
};
