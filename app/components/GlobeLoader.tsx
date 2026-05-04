'use client';

import { useEffect, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule } from 'd3-geo';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

// Stessi dati Natural Earth 110m usati da /globe
const COUNTRIES_URL =
  'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

let cached: FeatureCollection | null = null;
let pending: Promise<FeatureCollection> | null = null;

function loadCountries(): Promise<FeatureCollection> {
  if (cached) return Promise.resolve(cached);
  if (pending) return pending;
  pending = fetch(COUNTRIES_URL)
    .then((r) => r.json() as Promise<FeatureCollection>)
    .then((d) => {
      cached = d;
      return d;
    });
  return pending;
}

const PURPLE = '#9d4edd';
const PURPLE_SOFT = 'rgba(157, 78, 221, 0.62)';
const PURPLE_GRID = 'rgba(157, 78, 221, 0.28)';
const PURPLE_FILL = 'rgba(157, 78, 221, 0.08)';

export default function GlobeLoader({ size = 200 }: { size?: number }) {
  const [countries, setCountries] = useState<FeatureCollection | null>(cached);
  const [rotation, setRotation] = useState(0);

  // Carica i dati una volta
  useEffect(() => {
    if (!countries) loadCountries().then(setCountries).catch(() => {});
  }, [countries]);

  // Animazione rotazione
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setRotation((r) => (r + dt * 0.05) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const r = size / 2;
  const padding = Math.max(6, size * 0.04);
  const projection = geoOrthographic()
    .scale(r - padding)
    .translate([r, r])
    .rotate([rotation, -18, 0])
    .clipAngle(90);

  const pathFn = geoPath(projection);
  const graticule = pathFn(geoGraticule().step([15, 15])()) || '';
  const sphere = pathFn({ type: 'Sphere' }) || '';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Glow */}
      <div
        style={{
          position: 'absolute',
          inset: -size * 0.08,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(157,78,221,0.22), transparent 65%)',
          animation: 'globe-pulse 2.4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* Whirl arc esterno */}
      <svg
        width={size + 18}
        height={size + 18}
        viewBox={`0 0 ${size + 18} ${size + 18}`}
        style={{
          position: 'absolute',
          top: -9,
          left: -9,
          animation: 'globe-ring1 4.5s linear infinite',
        }}
      >
        <circle
          cx={(size + 18) / 2}
          cy={(size + 18) / 2}
          r={(size + 4) / 2}
          fill="none"
          stroke={PURPLE_SOFT}
          strokeWidth={Math.max(1.2, size / 100)}
          strokeDasharray={`${size * 0.55} ${size * 1.6}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Globo */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* Sfera background */}
        <path d={sphere} fill="rgba(20,0,40,0.5)" />

        {/* Graticola lat/lon */}
        <path d={graticule} fill="none" stroke={PURPLE_GRID} strokeWidth="0.5" />

        {/* Paesi */}
        {countries?.features.map((f: Feature<Geometry, GeoJsonProperties>, i: number) => {
          const d = pathFn(f);
          if (!d) return null;
          return (
            <path
              key={i}
              d={d}
              fill={PURPLE_FILL}
              stroke={PURPLE_SOFT}
              strokeWidth="0.55"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Outline sfera */}
        <path
          d={sphere}
          fill="none"
          stroke={PURPLE}
          strokeWidth={Math.max(1, size / 130)}
        />
      </svg>
    </div>
  );
}
