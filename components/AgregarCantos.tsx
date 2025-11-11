// Componente para agregar cantos de la base de datos
"use client";
import { useState, useEffect } from 'react';
import { obtenerCantos, crearCanto } from '@/services/cantos';
import { Canto } from '@/types/supabase';
import toast from 'react-hot-toast';


export default function ModificarCantos() {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevasEstrofas, setNuevasEstrofas] = useState<string[]>([]);
  const [cantidadEstrofas, setCantidadEstrofas] = useState(1);

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerCantos();
      setCantos(data);
    };

    cargar();
  }, []);

    const handleCrearCanto = async () => {

        if (nuevoTitulo.trim() === '') {
            toast.error('El título no puede estar vacío');
            return;
        }
        if (nuevasEstrofas.length === 0 || nuevasEstrofas.some(e => e.trim() === '')) {
            toast.error('Todas las estrofas deben estar completas');
            return;
        }

        try {
            const nuevoCanto: Partial<Canto> = {
                titulo: nuevoTitulo,
                estrofas: nuevasEstrofas,
                uso_total: 0,
                ultima_vez_usado: null,
            };
            const cantoCreado = await crearCanto(nuevoCanto);
            setCantos(prev => [cantoCreado, ...prev]);
            toast.success('Canto creado exitosamente');
            setNuevoTitulo('');
            setNuevasEstrofas([]);
            setCantidadEstrofas(1);
        } catch (error) {
            toast.error('Error al crear el canto');
            console.error(error);
        }
    };

    return (
        //Set titulo and estrofas for new canto
        <form onSubmit={(e) => {e.preventDefault(); handleCrearCanto();}} className="flex flex-col gap-4 w-full mx-auto bg-primary self-baseline mt-4">
            <h1 className="text-3xl font-bold mb-4 text-center text-background uppercase">Agregar Canto Nuevo</h1>
            <div className="flex mx-4 justify-around pb-10">
                <div>
                    <label className="text-background mr-2">Título:</label>
                    <input type="text" value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} className="bg-background border border-primary w-100 text-secondary bg-background p-2 rounded-lg mt-1 p-2"/>
                </div>
                <div>
                    <label className="text-background mr-2">Cantidad de diapositivas: </label>
                    <input type="number" value={cantidadEstrofas} onChange={(e) => setCantidadEstrofas(Number(e.target.value)) } min="1" className="border border-primary text-xl w-15 text-secondary text-center bg-background p-2 rounded-lg mt-1"/>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4 pb-10">
                <h2 className="w-full text-2xl font-medium text-background mb-4 text-center">Diapositivas:</h2>
                {Array.from({ length: cantidadEstrofas }, (_, i) => (
                    <div key={i} className="flex items-center">
                        <label className="text-background mr-2">{i + 1}:</label>
                        <textarea value={nuevasEstrofas[i] || ''} onChange={(e) => {
                            const nuevas = [...nuevasEstrofas];
                            nuevas[i] = e.target.value;
                            setNuevasEstrofas(nuevas);
                        }} className="border border-primary text-secondary bg-background p-2 rounded-lg mt-1 h-40 w-80"/>
                    </div>
                ))}
            </div>

            <button type="submit" className="bg-secondary text-white px-4 py-2 mr-10 mb-10 w-40 self-end rounded hover:opacity-50">
                Crear Canto
            </button>
        </form>
    );
    
}