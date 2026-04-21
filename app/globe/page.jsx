"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Importazione dinamica per evitare errori lato server (SSR)
const GlobeDynamic = dynamic(() => import("../components/GlobeComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#000011] text-white">
      Caricamento mappa stellare...
    </div>
  ),
});

export default function EsploraPage() {
  const [nazioneSelezionata, setNazioneSelezionata] = useState(null);

  return (
    <div className="relative w-full h-screen bg-[#000011] overflow-hidden">
      {/* UI Sovrapposta */}
      <div className="absolute top-10 left-10 z-10 bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl max-w-sm text-white">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">World Explorer</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Seleziona una nazione dal globo per pianificare il tuo prossimo viaggio con l'AI.
        </p>
        
        {nazioneSelezionata ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/10 border border-white/20 p-4 rounded-xl">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Destinazione</p>
              <h2 className="text-xl font-semibold mb-4">{nazioneSelezionata}</h2>
              <button className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors">
                Genera Itinerario
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm italic text-gray-500 border-l-2 border-white/20 pl-4">
            In attesa di una selezione...
          </div>
        )}
      </div>

      {/* Il Globo */}
      <div className="w-full h-full cursor-grab active:cursor-grabbing">
        <GlobeDynamic onCountrySelect={(name) => setNazioneSelezionata(name)} />
      </div>
    </div>
  );
}