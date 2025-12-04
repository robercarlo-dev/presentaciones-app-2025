export interface UploadResponse {
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
  }
  
export interface UploadState {
  file: File | null;
  uploading: boolean;
  imageUrl: string | null;
  error: string | null;
}

  // Tipos para las imágenes
export interface ImageInfo {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImagesResponse {
  success: boolean;
  images: ImageInfo[];
  total: number;
  error?: string;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}