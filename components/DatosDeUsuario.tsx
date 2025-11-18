'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import RemainingHeightDiv from '@/components/RemainingHeightDiv';
import { Icon } from "./SvgIcons";

export default function DatosDeUsuario() {
    const { user, setUser } = useUser(); // Asegúrate de que `setUser` esté disponible en el contexto

    const [nombre, setNombre] = useState<string>(user?.nombre || '');
    const [password, setPassword] = useState<string>('');
    const [correo, setCorreo] = useState<string>(user?.email || '');
    const [congregacion, setCongregacion] = useState<string>(user?.congregacion || '');
    
    // Estado para almacenar el valor original
    const [origNombre, setOrigNombre] = useState<string>(nombre);
    const [origCorreo, setOrigCorreo] = useState<string>(correo);
    const [origCongregacion, setOrigCongregacion] = useState<string>(congregacion);

    const [cambiarNombre, setCambiarNombre] = useState<boolean>(false);
    const [cambiarCorreo, setCambiarCorreo] = useState<boolean>(false);
    const [cambiarCongregacion, setCambiarCongregacion] = useState<boolean>(false);
    const [cambiarPassword, setCambiarPassword] = useState<boolean>(false);

    const [nuevoPass, setNuevoPass] = useState<string>('');
    const [confirmPass, setConfirmPass] = useState<string>('');
      

    useEffect(() => {
        if (cambiarNombre) {
            document.getElementById('nombreInput')?.focus();
        } else if (cambiarCorreo) {
            document.getElementById('correoInput')?.focus();
        } else if (cambiarCongregacion) {
            document.getElementById('congregacionInput')?.focus();
        } else if (cambiarPassword) {
            document.getElementById('actualPassInput')?.focus();
        }
    }, [cambiarNombre, cambiarCorreo, cambiarCongregacion, cambiarPassword]);

    const actualizarNombre = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return; 
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update({ nombre })
                .eq('id', user?.id)
                .select()
                .single();
            if (error) throw error;
            toast.success('Nombre actualizado correctamente');
            setCambiarNombre(false);
            setUser({ ...user, nombre: data.nombre }); // Actualiza el contexto del usuario
        } catch (error) {
            toast.error('Error al actualizar el nombre');
            console.error('Error updating name:', error);
        }
    };

    const actualizarCorreo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return; 
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update({ email: correo })
                .eq('id', user?.id)
                .select()
                .single();
            if (error) throw error;
            toast.success('Correo electrónico actualizado correctamente');
            setCambiarCorreo(false);
            setUser({ ...user, email: data.email }); // Actualiza el contexto del usuario
        } catch (error) {
            toast.error('Error al actualizar el correo electrónico');
            console.error('Error updating email:', error);
        }
    };

    const actualizarCongregacion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return; 
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .update({ congregacion })
                .eq('id', user?.id)
                .select()
                .single();
            if (error) throw error;
            toast.success('Congregación actualizada correctamente');
            setCambiarCongregacion(false);
            setUser({ ...user, congregacion: data.congregacion }); // Actualiza el contexto del usuario
        } catch (error) {
            toast.error('Error al actualizar la congregación');
            console.error('Error updating congregation:', error);
        }
    };

    const actualizarPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return; 
        if (nuevoPass !== confirmPass) {
            toast.error('Las contraseñas nuevas no coinciden');
            return;
        }
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: nuevoPass,
            });
            if (error) throw error;
            toast.success('Contraseña actualizada correctamente');
            setCambiarPassword(false);
        } catch (error) {
            toast.error('Error al actualizar la contraseña');
            console.error('Error updating password:', error);
        }
    };

    const handleCancelar = (type: string) => {
        switch (type) {
            case 'nombre':
                setNombre(origNombre);
                setCambiarNombre(false);
                break;
            case 'correo':
                setCorreo(origCorreo);
                setCambiarCorreo(false);
                break;
            case 'congregacion':
                setCongregacion(origCongregacion);
                setCambiarCongregacion(false);
                break;
            case 'password':
                setCambiarPassword(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className="flex flex-col gap-4 w-9/10 sm:w-7/10 lg:w-5/10 rounded-lg mx-auto bg-primary mt-10 overflow-auto">
            <RemainingHeightDiv className="p-4">
                <h2 className="text-2xl font-semibold mb-4 text-background">Mis Datos</h2>
                <div className="flex flex-wrap gap-3 items-center mb-4 border-b border-background pb-4">
                    <Icon name="nombre" size="xl" className="fill-secondary text-transparent" />
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Nombre:</label>
                        <p className="text-background">{nombre}</p>
                    </div>
                    <button className="border border-secondary bg-background/20 text-secondary text-sm p-1 ml-auto rounded-md cursor-pointer hover:bg-background" onClick={() => { setOrigNombre(nombre); setCambiarNombre(true); }}>Cambiar Nombre</button>
                    {
                        cambiarNombre && (
                            <form onSubmit={(e) => actualizarNombre(e)} className="flex flex-col items-start gap-2 mt-2 w-full">
                                <input
                                    id="nombreInput"
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="border border-primary rounded-md p-2 w-6/10 text-secondary bg-background"
                                    placeholder="Nuevo nombre"
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-background text-primary px-4 py-2 rounded-md hover:opacity-75">Guardar</button>
                                    <button type="button" onClick={() => handleCancelar('nombre')} className="bg-secondary text-background px-4 py-2 rounded-md hover:opacity-75">Cancelar</button>
                                </div>
                            </form>
                        )}
                </div>
                <div className="flex flex-wrap gap-3 items-center mb-4 border-b border-background pb-4">
                    <Icon name="correo" size="xl" className="fill-secondary text-transparent" />
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Correo Electrónico:</label>
                        <p className="text-background">{correo}</p>
                    </div>
                    <button className="border border-secondary bg-background/20 text-secondary text-sm p-1 ml-auto rounded-md cursor-pointer hover:bg-background" onClick={() => { setOrigCorreo(correo); setCambiarCorreo(true); }}>Cambiar Correo</button>
                    {
                        cambiarCorreo && (
                            <form onSubmit={(e) => actualizarCorreo(e)} className="flex flex-col items-start gap-2 mt-2 w-full">
                                <input
                                    id="correoInput"
                                    type="text"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    className="border border-primary rounded-md p-2 w-6/10 text-secondary bg-background"
                                    placeholder="Nuevo correo electrónico"
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-background text-primary px-4 py-2 rounded-md hover:opacity-75">Guardar</button>
                                    <button type="button" onClick={() => handleCancelar('correo')} className="bg-secondary text-background px-4 py-2 rounded-md hover:opacity-75">Cancelar</button>
                                </div>
                            </form>
                        )}
                </div>
                
                <div className="flex flex-wrap gap-3 items-center mb-4 border-b border-background pb-4">
                    <Icon name="congregacion" size="xl" className="fill-secondary text-transparent" />
                    <div>
                        <label className="block text-xs font-medium text-secondary mb-1">Congregación:</label>
                        <p className="text-background">{congregacion}</p>
                    </div>
                    <button className="border border-secondary bg-background/20 text-secondary text-sm p-1 ml-auto rounded-md cursor-pointer hover:bg-background" onClick={() => { setOrigCongregacion(congregacion); setCambiarCongregacion(true); }}>Cambiar Congregación</button>
                    {
                        cambiarCongregacion && (
                            <form onSubmit={(e) => actualizarCongregacion(e)} className="flex flex-col items-start gap-2 mt-2 w-full">
                                <input
                                    id="congregacionInput"
                                    type="text"
                                    value={congregacion}
                                    onChange={(e) => setCongregacion(e.target.value)}
                                    className="border border-primary rounded-md p-2 w-6/10 text-secondary bg-background"
                                    placeholder="Nueva congregación"
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-background text-primary px-4 py-2 rounded-md hover:opacity-75">Guardar</button>
                                    <button type="button" onClick={() => handleCancelar('congregacion')} className="bg-secondary text-background px-4 py-2 rounded-md hover:opacity-75">Cancelar</button>
                                </div>
                            </form>
                        )}
                </div>

                <div className="flex flex-wrap gap-3 items-center mb-4 mt-5 pb-4">
                    <Icon name="password" size="xl" className="fill-secondary text-transparent" />
                    <div>
                        <label className="block font-medium text-background mb-1">Contraseña</label>
                    </div>
                    <button className="border border-secondary bg-background/20 text-secondary text-sm p-1 ml-auto rounded-md cursor-pointer hover:bg-background" onClick={() => { setNuevoPass(''); setConfirmPass(''); setCambiarPassword(true); }}>Cambiar Contraseña</button>
                    {
                        cambiarPassword && (
                            <form onSubmit={(e) => actualizarPassword(e)} className="flex flex-col items-start gap-2 mt-2 w-full">
                                <input
                                    id="actualPassInput"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border border-primary rounded-md p-2 w-6/10 text-secondary bg-background"
                                    placeholder="Contraseña actual"
                                />
                                <input
                                    id="nuevoPassInput"
                                    type="password"
                                    value={nuevoPass}
                                    onChange={(e) => setNuevoPass(e.target.value)}
                                    className="border border-primary rounded-md p-2 w-6/10 text-secondary bg-background"
                                    placeholder="Contraseña Nueva"
                                />
                                <input
                                    id="confirmPassInput"
                                    type="password"
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    className="border border-primary rounded-md p-2 w-6/10 text-secondary bg-background"
                                    placeholder="Confirmar Contraseña Nueva"
                                />
                                <div className="flex gap-2">
                                    <button type="submit" className="bg-background text-primary px-4 py-2 rounded-md hover:opacity-75">Guardar</button>
                                    <button type="button" onClick={() => handleCancelar('password')} className="bg-secondary text-background px-4 py-2 rounded-md hover:opacity-75">Cancelar</button>
                                </div>
                            </form>
                        )}
                </div>
            </RemainingHeightDiv>
        </div>
    );
}