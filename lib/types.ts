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
