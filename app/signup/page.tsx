'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [congregacion, setCongregacion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { setUser } = useUser(); // <-- usamos el contexto
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const { error: dbError, data: perfil } = await supabase.from('usuarios').insert([
        {
          id: userId,
          nombre,
          email,
          congregacion,
        },
      ]).select('*').single(); // <-- obtenemos el perfil insertado

      if (dbError) {
        setErrorMsg(dbError.message);
        return;
      }

      setUser(perfil); // <-- actualizamos el contexto
    }

    router.push('/'); // Redirige al home o dashboard
  };

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Registro</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Congregación</label>
          <input
            type="text"
            value={congregacion}
            onChange={e => setCongregacion(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded"
          />
        </div>
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Registrarse
        </button>
      </form>
    </main>
  );
}