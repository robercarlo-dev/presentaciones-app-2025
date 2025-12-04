import { readdir, stat } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

// Tipos para la respuesta
interface ImageInfo {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

interface ImagesResponse {
  success: boolean;
  images: ImageInfo[];
  total: number;
  error?: string;
}

export async function GET(): Promise<NextResponse<ImagesResponse>> {
  try {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Leer archivos del directorio
    let files: string[];
    try {
      files = await readdir(uploadDir);
    } catch (error) {
      // Si el directorio no existe, devolver array vacío
      return NextResponse.json({
        success: true,
        images: [],
        total: 0
      });
    }

    // Filtrar y obtener información de cada imagen
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const imagePromises = files.map(async (filename) => {
      const ext = path.extname(filename).toLowerCase();
      
      if (imageExtensions.includes(ext)) {
        const filePath = path.join(uploadDir, filename);
        const fileStats = await stat(filePath);
        
        return {
          filename,
          url: `/uploads/${filename}`,
          size: fileStats.size,
          createdAt: fileStats.birthtime.toISOString(),
          updatedAt: fileStats.mtime.toISOString()
        } as ImageInfo;
      }
      return null;
    });

    const imageResults = await Promise.all(imagePromises);
    const images = imageResults.filter((img): img is ImageInfo => img !== null);
    
    // Ordenar por fecha de creación (más reciente primero)
    images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      images,
      total: images.length
    });
  } catch (error) {
    console.error('Error reading images directory:', error);
    return NextResponse.json(
      { 
        success: false, 
        images: [], 
        total: 0, 
        error: 'Error al leer las imágenes' 
      },
      { status: 500 }
    );
  }
}