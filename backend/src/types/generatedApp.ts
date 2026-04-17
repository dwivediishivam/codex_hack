export type GeneratedFieldType = "text" | "number" | "date" | "notes";

export interface GeneratedField {
  id: string;
  label: string;
  placeholder: string;
  type: GeneratedFieldType;
}

export interface GeneratedAppView {
  id: string;
  title: string;
  description: string;
}

export interface GeneratedAppSpec {
  name: string;
  summary: string;
  description: string;
  accent: string;
  focus: string[];
  fields: GeneratedField[];
  views: GeneratedAppView[];
  primaryActionLabel: string;
  emptyStateTitle: string;
  emptyStateBody: string;
}
