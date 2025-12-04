//Component for managing and displaying a presentation list with drag-and-drop functionality
"use client";

import { useState, useOptimistic, startTransition } from 'react';
import { usePresentation } from '../../context/PresentationContext';
import { useMediaQuery } from "react-responsive";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import DraggableItem from '../layout/DraggableItem';
import { Icon } from '../ui/SvgIcons';
import PptxGenJS from 'pptxgenjs';
import FullScreenSelect from '../features/FullScreenSelect';
import { useTarjetas } from '@/hooks/useTarjetas';
import { Tarjeta, Canto } from '@/types/supabase';

type Props = {
  listaId: string;
};

const ListaPresentaciones: React.FC<Props> = ({ listaId }) => {
  const { listas, editarNombreLista, eliminarLista, removerCantoDeLista, reordenarCantosEnLista, guardarListaBorrador } = usePresentation();
  const lista = listas.find((l) => l.id === listaId);
  const { data: tarjetas } = useTarjetas();

  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(lista?.nombre || '');
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const is2XLDesktop = useMediaQuery({ minWidth: 1536 });
  
  const [displaySelect, setDisplaySelect] = useState<boolean>(false);
  const [tarjetasEnLista, setTarjetasEnLista] = useState<Tarjeta[]>([]);
  const [itemsEnLista, setItemsEnLista] = useState<(Tarjeta | Canto)[]>([]);

  if (!lista) return null;

  // Estado optimista para los cantos
  const [optimisticCantos, addOptimistic] = useOptimistic(
    lista?.cantos || [],
    (state, newCantos: typeof lista.cantos) => newCantos
  );

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lista.cantos.findIndex((item) => item.id === active.id);
    const newIndex = lista.cantos.findIndex((item) => item.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Crear nuevo orden optimista
    const nuevosCantos = arrayMove(lista.cantos, oldIndex, newIndex);
    const ordenIds = nuevosCantos.map((c) => c.id);

    // Usar startTransition para envolver la actualización optimista
    startTransition(() => {
      // Actualización optimista: actualizar UI inmediatamente
      addOptimistic(nuevosCantos);
      
     // Persistir cambios en el contexto (función síncrona)
     try {
        reordenarCantosEnLista(listaId, ordenIds);
      } catch (error) {
        console.error("Error al reordenar:", error);
        // Si hay error, la actualización del contexto revertirá el estado
        // cuando se actualice el contexto global
      }
    });
  };

  const handleGuardarNombre = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre || nombre === lista.nombre) {
      setEditandoNombre(false);
      return;
    }
    
    // También envolver esta actualización en startTransition si usa useOptimistic
    startTransition(() => {
      editarNombreLista(listaId, nombre);
    });
    setEditandoNombre(false);
  };

  const addTarjeta = (tarjetaId: string) => {
    const tarjeta = tarjetas?.find(t => t.id === tarjetaId);
    if (tarjeta) {
      setTarjetasEnLista(prev => [...prev, tarjeta]);
    }
    setDisplaySelect(false);
  }

  const handleGuardar = async () => {
    try {
      const newId = await guardarListaBorrador(listaId);
      alert("Lista guardada correctamente.");
    } catch (e) {
      console.error("Error al guardar lista:", e);
    }
  };

  const handleEliminar = () => {
    eliminarLista(listaId);
  }
  
  const handleDescargar = () => {
    // Usar los datos actuales del contexto, no los optimistas
    const pptx = new PptxGenJS();
    lista.cantos.forEach((canto) => {
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '000000', path: 'images/bg-titulos.jpg' };
      titleSlide.addText(canto.titulo, {
        x: 0,
        y: 1.51,
        h: 2.61,
        w: '100%',
        color: 'FFFFFF',
        fontSize: 60,
        bold: true,
        align: 'center',
      });

      canto.estrofas.forEach((estrofa, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: '000000', path: 'images/bg-cantos.jpg' };

        slide.addText(`${index + 1}`, {
          x: 0.08,
          y: 0,
          w: 0.5,
          h: 0.5,
          color: 'FFFFFF',
          align: 'left',
        });

        let fontSize = 50;
        const minFontSize = 36;
        const maxCharactersPerLine = 27;
        const maxLines = 7;

        const linesArray = estrofa.split('\n');
        let totalLines = 0;

        linesArray.forEach((line) => {
          totalLines += Math.ceil(line.length / maxCharactersPerLine);
        });

        while (totalLines > maxLines && fontSize > minFontSize) {
          fontSize -= 2;
          totalLines = 0;
          linesArray.forEach((line) => {
            totalLines += Math.ceil(line.length / maxCharactersPerLine);
          });
        }

        slide.addText(estrofa, {
          isTextBox: true,
          fit: 'shrink',
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
          fontSize: fontSize,
          color: 'FFFFFF',
          align: 'center',
        });

        if (canto.estrofas.length === index + 1) {
          slide.addText('Fin', {
            x: 9.42,
            y: 5.145,
            w: 0.54,
            h: 0.42,
            color: 'FFFFFF',
            italic: true,
            align: 'left',
          });
        }
      });
    });

    pptx.writeFile({ fileName: `${lista.nombre || 'presentacion'}.pptx` });
  };

  return (
    <div className="bg-primary rounded-xl md:py-5 py-15 px-6 w-screen max-w-39/40 md:max-w-[380px] lg:max-w-[480px] xl:max-w-[620px] 2xl:max-w-[730px]" style={{ height: `calc(100vh - 90px)`, minHeight: '700px', }}>
      <div className="text-center mb-2">
        {editandoNombre ? (
          <div className="flex items-center gap-2 text-background">
            <input 
              type="text" 
              value={nuevoNombre} 
              onChange={(e) => setNuevoNombre(e.target.value)} 
              className="border px-2 py-1 rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGuardarNombre();
                if (e.key === 'Escape') {
                  setEditandoNombre(false);
                  setNuevoNombre(lista.nombre);
                }
              }}
            />
            <button onClick={handleGuardarNombre}>
              <Icon name="guardar" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent hover:opacity-50" />
            </button>
          </div>
        ) : (
          <h3 className="font-goham font-bold uppercase text-l xl:text-3xl text-background text-center mb-3">
            {lista.nombre}
          </h3>
        )}
        <div className="flex gap-2 item-center justify-center">
          <button onClick={() => setDisplaySelect(true)} className='text-background text-xs hover:cursor-pointer hover:opacity-50'>
            <Icon name="select" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
            Tarjetas
          </button>
          {lista.cantos.length > 0 && (
            <button onClick={handleDescargar} className='text-background text-xs hover:cursor-pointer hover:opacity-50'>
              <Icon name="download" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
              Descargar
            </button>
          )}
          {!lista.isSaved && (
            <button onClick={handleGuardar} className='text-background text-xs min-w-15 hover:cursor-pointer hover:opacity-50'>
              <Icon name="guardar" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl " />
              Guardar
            </button>
          )}
          {!editandoNombre && (
            <button onClick={() => setEditandoNombre(true)} className="text-background text-xs min-w-15 hover:cursor-pointer hover:opacity-50">
              <Icon name="editar" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
              Editar
            </button>
          )}
          <button onClick={handleEliminar} className="text-background text-xs min-w-15 hover:cursor-pointer hover:opacity-50">
            <Icon name="trash" size={`${ is2XLDesktop ? "xxxl" : isTablet ? "lg" : "xl" }`} className="fill-background text-transparent mb-1 mx-auto drop-shadow-xl" />
            Eliminar
          </button>  
        </div>
      </div>

      <div className="draggable-container overflow-auto border rounded-xl p-6 bg-background h-8/10">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          {/* Usamos optimisticCantos en lugar de lista.cantos */}
          <SortableContext items={optimisticCantos} strategy={verticalListSortingStrategy}>
            <ul>
              {optimisticCantos.map((canto) => (
                <DraggableItem
                  key={canto.id}
                  canto={canto}
                  removeCanto={(id) => removerCantoDeLista(listaId, id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      {tarjetas && displaySelect && (
        <FullScreenSelect
          items={tarjetas}
          onChange={(id) => {addTarjeta(id)}}
          placeholder='Seleccionar tarjeta'
          onClose={() => setDisplaySelect(false)}
        />
      )}
    </div>
  );
};

export default ListaPresentaciones;