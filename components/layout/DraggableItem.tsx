//Component for a draggable item in a sortable list using dnd-kit
"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Canto, Tarjeta } from '@/types/supabase';
import { Icon } from '../ui/SvgIcons';

const DraggableItem = ({ elemento, removeElemento}: { elemento: Canto | Tarjeta, removeElemento: (id:string) => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useSortable({ id: elemento.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <li ref={setNodeRef} style={style} className={`grid grid-cols-12 mb-1 ${'nombre' in elemento ? 'bg-secondary text-background' : 'bg-accent text-primary'}`}>
      
        <div {...attributes} {...listeners} className="text-lg truncate col-span-11 flex items-center  ml-3 cursor-move">
          <span className="font-light truncate block overflow-hidden whitespace-nowrap">
          {'nombre' in elemento ? elemento.nombre : elemento.titulo}
          </span>
        </div>

        <button onClick={(event) => {event.stopPropagation(); console.log(`Attempting to remove elemento with id: ${elemento.id}`);
        removeElemento(elemento.id);}} className="cursor-pointer bg-background">
          <Icon name="delete" size="xl" className="fill-black text-transparent drop-shadow-xl ml-1 hover:opacity-50" />
        </button>
    </li>
  );
};

export default DraggableItem;