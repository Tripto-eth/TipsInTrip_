"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Globe from "react-globe.gl";

export default function GlobeComponent({ onCountrySelect }) {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    // Caricamento dei confini delle nazioni
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => {
        const dataWithIds = {
          ...data,
          features: data.features.map((f, index) => ({
            ...f,
            id: f.properties.ISO_A3 || index
          }))
        };
        setCountries(dataWithIds);
      });
  }, []);

  const countriesData = useMemo(() => countries.features, [countries]);

  return (
    <Globe
      ref={globeEl}
      
      // --- TEXTURE E SFONDO ---
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundColor="rgba(0,0,0,0)" // Trasparente per usare lo sfondo della pagina
      showAtmosphere={true}
      atmosphereColor="#3a228a" // Un leggero tocco violaceo all'orizzonte
      atmosphereAltitude={0.15}
      
      // --- NAZIONI E CONFINI ---
      polygonsData={countriesData}
      polygonAltitude={0.01}
      
      // Colore interno: trasparente di base, leggero riflesso bianco al passaggio del mouse
      polygonCapColor={(d) =>
        d.id === hoverId ? "rgba(255, 255, 255, 0.12)" : "rgba(0,0,0,0)"
      }
      
      // Confini Bianchi Marcati e Sottili
      polygonStrokeColor={() => "#ffffff"} 
      polygonStrokeWidth={0.5}

      // --- TOOLTIP (Etichetta al passaggio del mouse) ---
      polygonLabel={({ properties: d }) => `
        <div style="
          background: rgba(0, 0, 0, 0.8); 
          color: white; 
          padding: 8px 12px; 
          border-radius: 4px; 
          font-family: sans-serif;
          font-size: 14px;
          border: 1px solid #555;
          pointer-events: none;
        ">
          <strong>${d.ADMIN}</strong>
        </div>
      `}

      // --- LOGICA DI INTERAZIONE ---
      onPolygonHover={(d) => setHoverId(d ? d.id : null)}
      onPolygonClick={(polygon) => {
        if (onCountrySelect) {
          onCountrySelect(polygon.properties.ADMIN);
        }
      }}
    />
  );
}