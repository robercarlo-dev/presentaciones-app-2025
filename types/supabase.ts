export type Canto = {
    id: string;
    titulo: string;
    estrofas: string[];
    uso_total: number;
    ultima_vez_usado: string | null;
  };
  
export type Usuario = {
    id: string;
    nombre: string;
    email: string;
    congregacion: string;
    es_admin: boolean;
  };


export type Lista = {
    id: string;
    nombre: string;
    usuario_id: string;
    fecha_creacion: string;
  };

export type Tarjeta = {
    id: string;
    titulo: string;
    imagen_urls: string[];
    nombre: string;
    tipo: string;
  };
  