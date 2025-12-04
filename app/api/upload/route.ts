import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Tipos para la respuesta
interface UploadSuccessResponse {
  success: true;
  url: string;
  filename: string;
}

interface UploadErrorResponse {
  success: false;
  error: string;
}

type FileUploadResult = UploadSuccessResponse | UploadErrorResponse;

interface UploadResponse {
  success: boolean;
  results: FileUploadResult[];
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[]; // Cambiado a 'images' y getAll

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          results: [],
          message: 'No se recibieron archivos' 
        },
        { status: 400 }
      );
    }

    // Límite de archivos (opcional)
    const maxFiles = 10;
    if (files.length > maxFiles) {
      return NextResponse.json(
        { 
          success: false, 
          results: [],
          message: `Máximo ${maxFiles} archivos permitidos` 
        },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Crear directorio si no existe
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creando directorio:', error);
    }

    const results: FileUploadResult[] = [];

    // Procesar cada archivo
    for (const file of files) {
      try {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          results.push({
            success: false,
            error: `El archivo ${file.name} no es una imagen`
          });
          continue;
        }

        // Validar extensión
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = path.extname(file.name).toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
          results.push({
            success: false,
            error: `Tipo de archivo no permitido para ${file.name}`
          });
          continue;
        }

        // Validar tamaño (máximo 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          results.push({
            success: false,
            error: `El archivo ${file.name} excede el tamaño máximo de 10MB`
          });
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generar nombre único
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const originalName = path.parse(file.name).name;
        const filename = `${originalName}-${uniqueSuffix}${fileExtension}`;

        const filepath = path.join(uploadDir, filename);

        // Guardar archivo
        await writeFile(filepath, buffer);

        // Devolver URL accesible
        const fileUrl = `/uploads/${filename}`;
        
        results.push({ 
          success: true, 
          url: fileUrl,
          filename: filename
        });

      } catch (error) {
        console.error(`Error procesando archivo ${file.name}:`, error);
        results.push({
          success: false,
          error: `Error procesando ${file.name}`
        });
      }
    }

    // Verificar si algún archivo se subió correctamente
    const successfulUploads = results.filter(result => result.success);
    
    return NextResponse.json({ 
      success: successfulUploads.length > 0,
      results: results,
      message: successfulUploads.length === 0 
        ? 'Ningún archivo pudo ser subido' 
        : `${successfulUploads.length} de ${files.length} archivos subidos correctamente`
    });
    
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { 
        success: false, 
        results: [],
        message: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}