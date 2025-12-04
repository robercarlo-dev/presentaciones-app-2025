// Componente para crear y modificar tarjetas para la presentación que puede contener texto e imágenes
"Use client";

import React, { useState, ChangeEvent, useEffect} from 'react';
import { ImageInfo } from '@/types/upload';
import { imageServiceAdapter } from '@/lib/image-service-adapter';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { Tarjeta } from '@/types/supabase';
import { crearTarjeta, actualizarTarjeta } from '@/services/tarjetas'; // Importar actualizarTarjeta
import { useFormStatus, useFormState } from 'react-dom';
import { uploadImageServerAction } from '../app/actions'; 
import ImageUploader from './ImageUploder';
import ImagesSelector from './ui/ImagesSelector';

// ... (SubmitButton permanece igual)

interface TipoTarjetaInputProps {
    inputType: string;
    tipoTarjeta: string;
    imagesQuantity: number;
    useTitle: boolean;
    tipoDescripcion: string;
    currentUrls?: string[];
    tarjetaExistente?: Tarjeta; // Nueva prop para la tarjeta existente
    onCancel?: () => void; // Función para cancelar edición
}

export default function TipoTarjetaInput({
    inputType, 
    tipoTarjeta, 
    imagesQuantity, 
    useTitle, 
    tipoDescripcion, 
    tarjetaExistente, // Recibir tarjeta existente
    onCancel // Recibir función de cancelar
}: TipoTarjetaInputProps) {
    // Inicializar estados con valores de tarjetaExistente si existe
    const [nombreTarjeta, setNombreTarjeta] = useState<string>(tarjetaExistente?.nombre || '');
    const [textoTarjeta, setTextoTarjeta] = useState<string>(tarjetaExistente?.titulo || '');
    const [imageUrls, setImageUrls] = useState<string[]>(tarjetaExistente?.imagen_urls || []);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [state, formAction] = React.useActionState(uploadImageServerAction, null);
    
    const { user } = useUser();
    const queryClient = useQueryClient();

    const key = ['tarjetas', user?.id ?? 'anon'];

    // Mutation para crear tarjeta
    const createMutation = useMutation({
      mutationFn: (data: Pick<Tarjeta, 'titulo' | 'imagen_urls' | 'nombre' | 'tipo'>) => crearTarjeta(data),
      onMutate: async (data) => {
        await queryClient.cancelQueries({ queryKey: key });
  
        const previous = queryClient.getQueryData<Tarjeta[]>(key);
  
        // Optimista: agrega una tarjeta temporal al inicio de la lista
        const tempId = `temp-${Date.now()}`;
        const tempTarjeta = {
          id: tempId,
          titulo: data.titulo,
          imagen_urls: data.imagen_urls,
          nombre: data.nombre,
          tipo: data.tipo,
        } as Tarjeta;
  
        queryClient.setQueryData<Tarjeta[]>(key, (old) => [tempTarjeta, ...(old ?? [])]);
  
        return { previous, tempId };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
        toast.error('Error al crear la tarjeta');
      },
      onSuccess: (serverTarjeta, _vars, ctx) => {
        // Reemplaza la tarjeta temporal por la que devuelve el servidor
        queryClient.setQueryData<Tarjeta[]>(key, (old) =>
          (old ?? []).map((c) => (c.id === ctx?.tempId ? serverTarjeta : c))
        );
        toast.success('Tarjeta creada exitosamente');
      },
      onSettled: () => {
        // Garantiza consistencia final
        queryClient.invalidateQueries({ queryKey: key });
      },
    });

    // Mutation para actualizar tarjeta
    const updateMutation = useMutation({
      mutationFn: (data: Pick<Tarjeta, 'id' | 'titulo' | 'imagen_urls' | 'nombre' | 'tipo'>) => 
        actualizarTarjeta(data),
      onMutate: async (data) => {
        await queryClient.cancelQueries({ queryKey: key });
  
        const previous = queryClient.getQueryData<Tarjeta[]>(key);
  
        // Optimista: actualiza la tarjeta en la lista
        queryClient.setQueryData<Tarjeta[]>(key, (old) =>
          (old ?? []).map((t) => 
            t.id === data.id ? { ...t, ...data } : t
          )
        );
  
        return { previous };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
        toast.error('Error al actualizar la tarjeta');
      },
      onSuccess: () => {
        toast.success('Tarjeta actualizada exitosamente');
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: key });
      },
    });
    
    const themes = {
        "default": ["#000", "fff"],
        "reverse": ["#fff", "000"],
        "indian_red": ["#d65a39", "#39b4d5"],
    }

    // Efecto para cargar datos existentes cuando cambia tarjetaExistente
    useEffect(() => {
      if (tarjetaExistente) {
        setNombreTarjeta(tarjetaExistente.nombre || '');
        setTextoTarjeta(tarjetaExistente.titulo || '');
        setImageUrls(tarjetaExistente.imagen_urls || []);
      }
    }, [tarjetaExistente]);

    // ... (handleImageSelect, handleFileChange, handleSubmit, handleChange permanecen iguales)

    const crearNuevaTarjeta = () => {
        console.log('Creando tarjeta de tipo:', tipoTarjeta);
        
        if (!nombreTarjeta.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }

        if (imageUrls.length < imagesQuantity) {
            toast.error(`Se requieren al menos ${imagesQuantity} imagen(es)`);
            return;
        }

        if (useTitle && !textoTarjeta.trim()) {
            toast.error('El título no puede estar vacío');
            return;
        }

        createMutation.mutate({
            titulo: textoTarjeta,
            imagen_urls: imageUrls,
            nombre: nombreTarjeta,
            tipo: tipoTarjeta,
        });

        // Limpiar formulario después de crear
        setNombreTarjeta('');
        setTextoTarjeta('');
        setImageUrls([]);
    }

    const modificarTarjeta = () => {
      console.log('Modificando tarjeta:', tarjetaExistente?.id);
      
      if (!tarjetaExistente) {
        toast.error('No hay tarjeta seleccionada para modificar');
        return;
      }

      if (!nombreTarjeta.trim()) {
          toast.error('El nombre no puede estar vacío');
          return;
      }

      if (imageUrls.length < imagesQuantity) {
          toast.error(`Se requieren al menos ${imagesQuantity} imagen(es)`);
          return;
      }

      if (useTitle && !textoTarjeta.trim()) {
          toast.error('El título no puede estar vacío');
          return;
      }

      updateMutation.mutate({
          id: tarjetaExistente.id,
          titulo: textoTarjeta,
          imagen_urls: imageUrls,
          nombre: nombreTarjeta,
          tipo: tipoTarjeta,
      });

      // Opcional: llamar a onCancel después de modificar
      if (onCancel) {
        onCancel();
      }
    }

    // ... (resto del código permanece igual)

    return (
        <div className="flex flex-col mt-5">
          <h1 className="text-secondary mb-5">
            {inputType === "modificar" ? `Modificar ${tipoDescripcion}` : tipoDescripcion}
          </h1>
            <div className="flex mt-5 gap-8">
              <div className="flex flex-col justify-around">
                <input
                    type="text"
                    value={nombreTarjeta}
                    onChange={(e) => setNombreTarjeta(e.target.value)}
                    placeholder="Nombre interno de la tarjeta"
                    className="border px-3 py-2 rounded-xl w-100 text-sm font-light text-secondary bg-background mb-4"
                />
                {useTitle && (
                  <input
                    type="text"
                    value={textoTarjeta}
                    onChange={(e) => setTextoTarjeta(e.target.value)}
                    placeholder="Texto en la tarjeta"
                    className="border px-3 py-2 rounded-xl w-100 text-sm font-light text-secondary bg-background mb-4"
                  />
                )}
              </div>
              {imagesQuantity >= 1 && (
                <div>
                    <ImageUploader />
                </div>
              )}
            </div>
            {imagesQuantity >= 1 && (
                <div className="flex mt-6">
                    <div>
                        <ImagesSelector 
                          imageService={imageServiceAdapter} 
                          onSelectionChange={(urls) => setImageUrls(urls)}  
                          maxSelection={imagesQuantity} 
                          initialSelectedUrls={imageUrls} // Usar el estado actual
                          showDeleteButton
                        />
                    </div>
                </div>
              )}
            <div className="flex gap-2 mt-4">
              {inputType === "crear" &&
                <button
                      onClick={crearNuevaTarjeta}
                      className="bg-secondary text-white px-4 py-2 rounded hover:opacity-50"
                  >
                      Crear Tarjeta
                  </button>
              }
              {inputType === "modificar" && (
                <>
                  <button
                        onClick={modificarTarjeta}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:opacity-50"
                    >
                        Guardar Cambios
                    </button>
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </>
              )}
            </div>
        </div>
    );
}