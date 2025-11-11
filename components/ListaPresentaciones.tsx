//Component for managing and displaying a presentation list with drag-and-drop functionality
"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { usePresentation } from '../context/PresentationContext';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import DraggableItem from './DraggableItem';
import { Icon } from './SvgIcons';
import PptxGenJS from 'pptxgenjs';
import { useRouter } from "next/navigation";

type Props = {
  listaId: string;
};

const ListaPresentaciones: React.FC<Props> = ({ listaId }) => {
  const { listas, editarNombreLista, eliminarLista, removerCantoDeLista, reordenarCantosEnLista, guardarListaBorrador, setListaActivaId, } = usePresentation();
  const lista = listas.find((l) => l.id === listaId);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(lista?.nombre || '');
  // const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const { user, isAuthenticated } = useUser();
  const router = useRouter();

  const sensors = useSensors(useSensor(PointerSensor));

  if (!lista) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lista.cantos.findIndex((item) => item.id === active.id);
    const newIndex = lista.cantos.findIndex((item) => item.id === over.id);
    const nuevosCantos = arrayMove(lista.cantos, oldIndex, newIndex);
    const ordenIds = nuevosCantos.map((c) => c.id);

    // reordenar y persistir (optimista)
    reordenarCantosEnLista(listaId, ordenIds);
  };

  const handleGuardarNombre = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre || nombre === lista.nombre) {
      setEditandoNombre(false);
      return;
    }
    editarNombreLista(listaId, nombre);
    setEditandoNombre(false);
  };

  const handleGuardar = async () => {
    if (!user || !isAuthenticated) {
      alert("Usuario no autenticado.");
      return;
    }
    try {
      const newId = await guardarListaBorrador(listaId);
      // Si listaId viene de la URL, navega al nuevo id
      router.replace(`/listas/${newId}`);
      // Si listaId viene del estado del padre, setListaActivaId:
      setListaActivaId(newId);
      alert("Lista guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar lista:", error);
    }
  };

  const handleEliminar = () => {
      eliminarLista(listaId);
  }
  const handleDescargar = () => {
    // Generar presentación PowerPoint
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

      // Crear una diapositiva por cada estrofa
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

        // Ajustar el tamaño de fuente dinámicamente
        let fontSize = 50; // Tamaño máximo de fuente
        const minFontSize = 36; // Tamaño mínimo de fuente
        const maxCharactersPerLine = 27; // Máximo de caracteres por línea
        const maxLines = 7; // Máximo de líneas permitidas

        // Dividir el texto por saltos de línea
        const linesArray = estrofa.split('\n');
        let totalLines = 0;

        // Calcular el número total de líneas necesarias
        linesArray.forEach((line) => {
          totalLines += Math.ceil(line.length / maxCharactersPerLine);
        });

        // Reducir el tamaño de fuente si el texto es demasiado largo
        while (totalLines > maxLines && fontSize > minFontSize) {
          fontSize -= 2; // Reducir el tamaño de fuente
          totalLines = 0; // Recalcular líneas con el nuevo tamaño de fuente
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
    <div className="bg-primary rounded-xl py-6 px-6 w-screen max-w-[480px] xl:max-w-[620px] 2xl:max-w-[730px]" style={{ height: `calc(100vh - 90px)`, minHeight: '700px', }}>
      <div className="text-center mb-4">
        {editandoNombre ? (
          <div className="flex items-center gap-2 text-background">
            <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} className="border px-2 py-1 rounded"/>
            <button onClick={handleGuardarNombre}>
              <Icon name="guardar" size="xxxl" className="fill-background text-transparent hover:opacity-50" />
            </button>
          </div>
        ) : (
          <h3 className="font-goham font-bold uppercase text-l xl:text-3xl text-background text-center mb-3">
            {lista.nombre}
          </h3>
        )}
        <div className="flex gap-2 item-center justify-end">
        {lista.cantos.length > 0 && (
          <button onClick={handleDescargar}>
            <Icon name="download" size="xxxl" className="fill-background text-transparent drop-shadow-xl hover:opacity-50" />
          </button>
        )

        }
        {!lista.isSaved && (
            <button
            onClick={handleGuardar}
          >
              <Icon name="guardar" size="xxxl" className="fill-background text-transparent drop-shadow-xl hover:opacity-50" />
          </button>
          )}
          {!editandoNombre && (
            <button
              onClick={() => setEditandoNombre(true)}
              className="text-blue-500 hover:underline"
            >
             <Icon name="editar" size="xxxl" className="fill-background text-transparent drop-shadow-xl hover:opacity-50" />
            </button>
          )}
          <button
            onClick={handleEliminar}
            className="text-red-500 hover:underline"
          >
            <Icon name="trash" size="xxxl" className="fill-background text-transparent drop-shadow-xl hover:opacity-50" />
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
          <SortableContext items={lista.cantos} strategy={verticalListSortingStrategy}>
            <ul>
              {lista.cantos.map((canto) => (
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
    </div>
  );
};

export default ListaPresentaciones;