//Verifica si el usuario existe en la "base de datos" (archivo JSON)
import usuarios from "@/data/usuarios.json";

export async function verificarUsuario(email: string, password: string) {
  const user = usuarios.find(
    (u) => u.correo === email && u.password === password
  );
  if (!user) return null;

  return {
    id: user.id,
    name: user.nombre,
    email: user.correo
  };
}
