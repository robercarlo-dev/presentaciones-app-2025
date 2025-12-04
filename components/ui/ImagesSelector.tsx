'use client';
import { useEffect, useState } from 'react';

// Interfaces más genéricas
export interface ImageInfo {
  url: string;
  filename: string;
  size: number;
  createdAt: string;
}

export interface ImageService {
  getImages: () => Promise<{ images: ImageInfo[] }>;
  deleteImage: (filename: string) => Promise<void>;
  formatFileSize?: (bytes: number) => string;
  formatDate?: (dateString: string) => string;
}

// Props más flexibles y reutilizables
interface ImagesSelectorProps {
  onSelectionChange: (urls: string[]) => void;
  imageService: ImageService;
  maxSelection?: number;
  initialSelectedUrls?: string[];
  showDeleteButton?: boolean;
  className?: string;
  emptyStateMessage?: string;
  selectionLimitMessage?: string;
  deleteConfirmationMessage?: string;
}

export default function ImagesSelector({
  onSelectionChange,
  imageService,
  maxSelection,
  initialSelectedUrls = [],
  showDeleteButton = true,
  className = '',
  emptyStateMessage = 'No hay imágenes guardadas',
  selectionLimitMessage = 'Solo puedes seleccionar hasta',
  deleteConfirmationMessage = '¿Estás seguro de que quieres eliminar esta imagen?'
}: ImagesSelectorProps) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>(initialSelectedUrls);

  // Helper functions con fallbacks
  const formatFileSize = (bytes: number): string => {
    if (imageService.formatFileSize) {
      return imageService.formatFileSize(bytes);
    }
    
    // Implementación por defecto
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (imageService.formatDate) {
      return imageService.formatDate(dateString);
    }
    
    // Implementación por defecto
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await imageService.getImages();
      setImages(response.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(deleteConfirmationMessage)) {
      return;
    }

    try {
      setDeleting(filename);
      await imageService.deleteImage(filename);
      
      // Remover la imagen eliminada de las seleccionadas si estaba seleccionada
      const imageToDelete = images.find(img => img.filename === filename);
      if (imageToDelete && selectedImages.includes(imageToDelete.url)) {
        const newSelected = selectedImages.filter(url => url !== imageToDelete.url);
        updateSelection(newSelected);
      }
      
      // Recargar la lista de imágenes
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la imagen');
    } finally {
      setDeleting(null);
    }
  };

  const updateSelection = (newSelected: string[]) => {
    setSelectedImages(newSelected);
    onSelectionChange(newSelected);
  };

  const handleSelectImage = (imageUrl: string) => {
    let newSelected: string[];
    
    if (selectedImages.includes(imageUrl)) {
      // Si ya está seleccionada, la removemos
      newSelected = selectedImages.filter(url => url !== imageUrl);
    } else {
      // Si no está seleccionada y hay límite, verificamos
      if (maxSelection && selectedImages.length >= maxSelection) {
        alert(`${selectionLimitMessage} ${maxSelection} imagen(es)`);
        return;
      }
      newSelected = [...selectedImages, imageUrl];
    }
    
    updateSelection(newSelected);
  };

  const isImageSelected = (imageUrl: string) => {
    return selectedImages.includes(imageUrl);
  };

  const isSelectionDisabled = (imageUrl: string) => {
    return !isImageSelected(imageUrl) && 
           maxSelection !== undefined && 
           selectedImages.length >= maxSelection;
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Sincronizar con cambios externos en initialSelectedUrls
  useEffect(() => {
    // Compare before updating to avoid unnecessary re-renders
    if (JSON.stringify(selectedImages) !== JSON.stringify(initialSelectedUrls)) {
      setSelectedImages(initialSelectedUrls);
    }
  }, [initialSelectedUrls]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-secondary">
          Selección de imágenes
        </h2>
        {maxSelection && (
          <div className="text-sm text-secondary">
            {selectedImages.length} / {maxSelection} seleccionadas
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {emptyStateMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.filename}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
                isImageSelected(image.url) 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200'
              }`}
            >
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {deleting === image.filename && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                {isImageSelected(image.url) && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                    ✓
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <p className="text-sm font-medium text-gray-900 truncate mb-2">
                  {image.filename}
                </p>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Tamaño: {formatFileSize(image.size)}</p>
                  <p>Subida: {formatDate(image.createdAt)}</p>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleSelectImage(image.url)}
                    disabled={isSelectionDisabled(image.url)}
                    className={`flex-1 text-center px-3 py-2 text-xs rounded ${
                      isImageSelected(image.url)
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isImageSelected(image.url) ? 'Deseleccionar' : 'Seleccionar'}
                  </button>
                  
                  {showDeleteButton && (
                    <button
                      onClick={() => handleDelete(image.filename)}
                      disabled={deleting === image.filename}
                      className="flex-1 px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting === image.filename ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}