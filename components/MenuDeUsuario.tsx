"use client";
import { useState, useEffect, useRef } from 'react';
import LogoutButton from './LogoutButton';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function MenuDeUsuario() {
    const { user, isAuthenticated, authReady, loading } = useUser();
    const firstLetter = user?.nombre ? user.nombre.charAt(0).toUpperCase() : '';
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null); // Specify HTMLDivElement for the ref
    const router = useRouter();
    const displayMenu = () => {
        setMenuOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!authReady || loading) {
        return <div>Cargando menú de usuario…</div>;
    }

    return (
        <div className="rounded-full ml-auto">
            <button onClick={displayMenu} className="hover:opacity-50">
                <div className="w-8 h-8 flex items-center justify-center bg-primary text-background rounded-full text-2xl font-light">
                    {firstLetter}
                </div>
            </button>
            {menuOpen && (
                <div ref={menuRef} className="absolute right-4 mt-1 w-65 bg-background border border-primary rounded-md shadow-lg z-50">
                    <div className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-primary text-background rounded-full text-4xl font-light">
                            {firstLetter}
                        </div>
                        <p className="text-gray-800 text-sm font-medium">¡Hola, {user?.nombre}!</p>
                    </div>
                    <hr className="border-t border-primary mx-4" />
                    <div className="flex flex-col gap-4 text-center mt-4">
                        <button className="bg-background text-gray-800 cursor-pointer hover:text-primary" onClick={() => router.push("/user")}>
                            Administrar cuenta
                        </button>
                        <button className="bg-background text-gray-800">
                            Apariencia
                        </button>
                    </div>
                    <div className="p-4">
                        <LogoutButton />
                    </div>
                </div>
            )}
        </div>
    );
}