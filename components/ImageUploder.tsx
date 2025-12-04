'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { UploadResponse, UploadState } from '@/types/upload';

// Actualiza estos tipos según la nueva respuesta del servidor
interface MultiUploadResponse {
  success: boolean;
  results: Array<{
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
  }>;
  message?: string;
}

interface MultiUploadState {
  files: File[];
  uploading: boolean;
  results: Array<{
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
  }>;
  error: string | null;
}

export default function ImageUploader() {
  const [state, setState] = useState<MultiUploadState>({
    files: [],
    uploading: false,
    results: [],
    error: null
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) {
      setState(prev => ({ ...prev, error: 'Por favor selecciona al menos un archivo' }));
      return;
    }

    // Validaciones básicas en el cliente
    const validFiles: File[] = [];
    const errors: string[] = [];

    selectedFiles.forEach(file => {
      if (!file.type.startsWith('image/')) {
        errors.push(`El archivo ${file.name} no es una imagen`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        errors.push(`El archivo ${file.name} excede el límite de 10MB`);
        return;
      }

      validFiles.push(file);
    });

    setState(prev => ({ 
      ...prev, 
      files: validFiles,
      error: errors.length > 0 ? errors.join(', ') : null,
      results: [] // Limpiar resultados anteriores
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (state.files.length === 0) {
      setState(prev => ({ ...prev, error: 'Por favor selecciona al menos un archivo' }));
      return;
    }

    setState(prev => ({ ...prev, uploading: true, error: null }));

    const formData = new FormData();
    
    // Agregar todos los archivos al FormData
    state.files.forEach(file => {
      formData.append('images', file); // Cambiado a 'images' (plural)
    });

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: MultiUploadResponse = await response.json();
      
      if (response.ok) {
        setState(prev => ({ 
          ...prev, 
          results: data.results,
          files: data.success ? [] : prev.files, // Limpiar solo si hubo éxito
          error: data.success ? null : data.message || 'Algunos archivos no se pudieron subir'
        }));

        // Limpiar el input file si todo fue exitoso
        if (data.success) {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      } else {
        setState(prev => ({ 
          ...prev, 
          error: data.message || 'Error al subir las imágenes' 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Error de conexión al subir las imágenes' 
      }));
    } finally {
      setState(prev => ({ ...prev, uploading: false }));
    }
  };

  const removeFile = (index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto min-w-80 p-6 bg-background rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="image-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar imágenes
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100"
            disabled={state.uploading}
            multiple
          />
          <p className="mt-1 text-xs text-gray-500">
            Puedes seleccionar múltiples imágenes (máximo 10 archivos, 10MB cada uno)
          </p>
        </div>

        {/* Lista de archivos seleccionados */}
        {state.files.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Archivos seleccionados ({state.files.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {state.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-gray-600">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={state.uploading || state.files.length === 0}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-background bg-secondary hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.uploading 
            ? `Subiendo ${state.files.length} archivo(s)...` 
            : `Subir ${state.files.length} archivo(s)`
          }
        </button>
      </form>

      {/* Resultados de la subida */}
      {state.results.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Resultados de la subida
          </h3>
          <div className="space-y-3">
            {state.results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-md ${
                  result.success 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {result.success ? '✓ Subido correctamente' : '✗ Error'}
                    </p>
                    <p className="text-sm opacity-80">
                      {result.filename || result.error}
                    </p>
                    {result.url && (
                      <p className="text-xs mt-1 break-all">
                        URL: {result.url}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Preview de imagen para subidas exitosas */}
                {result.success && result.url && (
                  <div className="mt-2 border rounded overflow-hidden">
                    <img 
                      src={result.url} 
                      alt={`Preview ${result.filename}`} 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}