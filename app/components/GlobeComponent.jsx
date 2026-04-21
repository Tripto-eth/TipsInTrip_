"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Globe from "react-globe.gl";

function getPolygonCentroid(feature) {
  const geom = feature.geometry;
  const coords = [];
  if (geom.type === 'Polygon') {
    coords.push(...geom.coordinates[0]);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) coords.push(...poly[0]);
  }
  if (!coords.length) return { lat: 0, lng: 0 };
  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  return { lat, lng };
}

export default function GlobeComponent({ onCountrySelect }) {
  const globeEl = useRef();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverId, setHoverId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetch("https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((data) => {
        setCountries({
          ...data,
          features: data.features.map((f, index) => ({
            ...f,
            id: f.properties.ISO_A3 || index,
          })),
        });
      });
  }, []);

  const countriesData = useMemo(() => countries.features, [countries]);

  return (
    <Globe
      ref={globeEl}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      backgroundColor="rgba(0,0,0,0)"
      showAtmosphere={true}
      atmosphereColor="#3a228a"
      atmosphereAltitude={0.15}
      polygonsData={countriesData}
      polygonAltitude={(d) => d.id === selectedId ? 0.06 : 0.01}
      polygonCapColor={(d) => {
        if (d.id === selectedId) return "rgba(157, 78, 221, 0.55)";
        if (d.id === hoverId) return "rgba(255, 255, 255, 0.12)";
        return "rgba(0,0,0,0)";
      }}
      polygonStrokeColor={(d) => d.id === selectedId ? "#e0aaff" : "#ffffff"}
      polygonStrokeWidth={(d) => d.id === selectedId ? 1.5 : 0.5}
      polygonLabel={({ properties: d }) => `
        <div style="background:rgba(0,0,0,0.85);color:white;padding:6px 12px;border-radius:6px;font-family:sans-serif;font-size:13px;border:1px solid #555;pointer-events:none;">
          <strong>${d.ADMIN}</strong>
        </div>
      `}
      onPolygonHover={(d) => setHoverId(d ? d.id : null)}
      onPolygonClick={(polygon) => {
        const centroid = getPolygonCentroid(polygon);
        setSelectedId(polygon.id);
        // Zoom sulla nazione cliccata
        if (globeEl.current) {
          globeEl.current.pointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 1.4 }, 800);
        }
        if (onCountrySelect) {
          onCountrySelect(polygon.properties.ADMIN, polygon.properties.ISO_A2);
        }
      }}
    />
  );
}
