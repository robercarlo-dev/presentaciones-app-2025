// Define the type for the Presentation Context
import { Canto } from '@/types/supabase';
import { ListaPresentacion } from './ListaPresentacion';

export type PresentationContextType = {
    selectedCantos: Canto[];
    setSelectedCantos: React.Dispatch<React.SetStateAction<Canto[]>>;
    addCanto: (canto: Canto) => void;
    removeCanto: (id: string) => void;
    
    listas: ListaPresentacion[];
    crearLista: (nombre: string) => void;
    eliminarLista: (id: string) => void;
    editarNombreLista: (id: string, nuevoNombre: string) => void;
    agregarCantoALista: (id: string, canto: Canto) => void;
    removerCantoDeLista: (id: string, cantoId: string) => void;
    reordenarCantosEnLista: (id: string, ordenIds: string[]) => void;
    // Guardar un borrador en DB -> retorna el nuevo id en DB
    guardarListaBorrador: (id: string) => Promise<string>;

    // Revalidar listas guardadas
    revalidateListas: () => void;
   
    listaActivaId: string | null;
    setListaActivaId: React.Dispatch<React.SetStateAction<string | null>>;
    
    cantoPreview: Canto | null;
    setCantoPreview: React.Dispatch<React.SetStateAction<Canto | null>>;
    
    favoritos: string[];
    setFavoritos: React.Dispatch<React.SetStateAction<string[]>>;
    // listasDelUsuario: ListaPresentacion[];
  };