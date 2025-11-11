import { supabase } from '@/lib/supabaseClient';

export async function registrarUsuario(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function iniciarSesion(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}


export async function obtenerUsuarioActual() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}


export async function obtenerIdUsuario(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        console.error('No se pudo obtener el usuario:', error?.message);
        return null;
    }

    return data.user.id;
}
  
  