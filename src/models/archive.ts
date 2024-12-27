type SpecifiedFile = {
  name: string;
  content: string;
  contentType: 'bytes' | 'url';
  path: string;
  pathTemplateValues?: string[];
};

export interface ArchiveFileBody {
  files: SpecifiedFile[];
  order?: number;
  overwrite?: boolean;
  parent?: string;
  metadata?: Record<string, unknown>;
}

export interface ArchiveFileResponse {
  message: string;
}
