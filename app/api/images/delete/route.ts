import { unlink } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

interface DeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Nombre de archivo requerido' },
        { status: 400 }
      );
    }

    // Validar que el filename no contenga rutas relativas
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Nombre de archivo inválido' },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'public/uploads', filename);

    try {
      await unlink(filePath);
      return NextResponse.json({
        success: true,
        message: 'Imagen eliminada correctamente'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { success: false, error: 'No se pudo eliminar la imagen' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in delete operation:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}