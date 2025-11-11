'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useUsuario() {
  const [usuario, setUsuario] = useState<User | null>(null);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUsuario(data.user);
      }
    };

    obtenerUsuario();
  }, []);

  return usuario;
}