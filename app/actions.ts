// app/actions.ts
'use server';

import { writeFile } from 'fs/promises';
import path from 'path';

// La acción recibe automáticamente el FormData como su primer argumento si se usa con <form action={...}>
export async function uploadImageServerAction(prevState: any, formData: FormData) {
  const file = formData.get('image') as File; // 'image' es el nombre que le dimos al input

  if (!file || file.size === 0) {
    return { success: false, message: 'No se seleccionó ningún archivo.' };
  }

  // Lógica para guardar la imagen (ejemplo local, recuerda usar nube para producción)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filePath = path.join(process.cwd(), 'public/uploads', file.name);
  const fileUrl = `/uploads/${file.name}`;

  try {
    await writeFile(filePath, buffer);
    console.log(`Imagen guardada en ${filePath}`);
    
    // Devolvemos un estado de éxito
    return { 
      success: true, 
      message: `Imagen subida con éxito: ${file.name}`,
      url: fileUrl 
    };

  } catch (error) {
    console.error('Fallo en la subida local:', error);
    // Devolvemos un estado de error
    return { success: false, message: 'Fallo al subir la imagen.' };
  }
}
