// lib/image-service-adapter.ts
import { ImageService } from './images';

export const imageServiceAdapter = {
  getImages: async () => {
    const response = await ImageService.getImages();
    return {
      images: response.images // Asegúrate que esto coincide
    };
  },
  deleteImage: ImageService.deleteImage,
  formatFileSize: ImageService.formatFileSize,
  formatDate: ImageService.formatDate
};