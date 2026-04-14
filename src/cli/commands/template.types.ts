export interface TemplateVariable {
  key: string;
  placeholder: string;
  defaultValue?: string;
  required: boolean;
}

export interface TemplateResult {
  outputFile: string;
  renderedContent: string;
  substitutions: TemplateSubstitution[];
  missingVariables: string[];
}

export interface TemplateSubstitution {
  placeholder: string;
  key: string;
  value: string;
  usedDefault: boolean;
}
