import { ImagesResponse, DeleteResponse } from '@/types/upload';

export class ImageService {
  static async getImages(): Promise<ImagesResponse> {
    try {
      const response = await fetch('/api/images', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      const data: ImagesResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener las imágenes');
      }

      return data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  }

  static async deleteImage(filename: string): Promise<void> {
    try {
      const response = await fetch(`/api/images/delete?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const data: DeleteResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la imagen');
      }
  
      // Solo esto cambia - eliminamos "return data"
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}