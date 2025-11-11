import { ListaPresentacion } from './ListaPresentacion';

export type Usuario = {
    id: string;
    nombre: string;
    correo: string;
    avatarUrl?: string;
    listas: ListaPresentacion[];
    historial: {
        fecha: string;
        accion: string;
        cantoId?: number;
    }[];
  };
  