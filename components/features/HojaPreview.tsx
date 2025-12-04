"use client";

import { usePresentation } from "../../context/PresentationContext";


export default function HojaPreview() {
    const { cantoPreview, setCantoPreview } = usePresentation();
    
    const handleClosePreview = () => {
        setCantoPreview(null);
    };
    
    if (!cantoPreview) {
        return null;
    }
    
    return (
        <>
            {cantoPreview && (
                <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-h-screen h-auto mx-auto overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl text-primary font-bold">{cantoPreview?.titulo}</h2>
                    <button
                        onClick={handleClosePreview}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        ✕
                    </button>
                    </div>
                    <div className="space-y-4">
                    {cantoPreview.estrofas.map((estrofa, index) => (
                        <p key={index} className="text-gray-700 whitespace-pre-line">
                        {estrofa}
                        </p>
                    ))}
                    </div>
                </div>
                </div>
            )}
        </>
    )
}