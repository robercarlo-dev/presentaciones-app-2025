'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function NombreUsuario() {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    const cargarNombre = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        const { data } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', userId)
          .single();

        if (data?.nombre) {
          setNombre(data.nombre);
        }
      }
    };

    cargarNombre();
  }, []);

  return (
    <div>
      {nombre ? `Hola, ${nombre}` : 'Cargando usuario...'}
    </div>
  );
}