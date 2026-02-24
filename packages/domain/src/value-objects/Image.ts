/**
 * Image metadata
 */
export interface Image {
  src: string;
  name?: string;
  alt?: string;
  directory: string;
  type: string;
  main: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Image upload request
 */
export interface ImageUpload {
  file?: unknown; // File or Blob (browser environment)
  url?: string;
  name?: string;
  alt?: string;
  main?: boolean;
}
