'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { setUser } = useUser(); // <-- usamos el contexto
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (perfilError) {
        setErrorMsg(perfilError.message);
        return;
      }

      setUser(perfil); // <-- actualizamos el contexto
      router.push('/'); // Redirige al home o dashboard
    } else {
      setErrorMsg('No se pudo obtener el usuario.');
    }
  };

  return (
    <main className="text-primary max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>

      <p className="mt-4 text-sm">
        ¿No tienes cuenta?{' '}
        <Link href={"/signup"} className="text-blue-500">Regístrate aquí
        </Link>
      </p>
    </main>
  );
}