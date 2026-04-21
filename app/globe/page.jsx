"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import MiniDatePicker from "../components/MiniDatePicker";
import AutocompleteInput from "../components/AutocompleteInput";

const GlobeDynamic = dynamic(() => import("../components/GlobeComponent"), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#000011', color: '#fff', opacity: 0.5 }}>
      Caricamento globo...
    </div>
  ),
});

// Aeroporti italiani hardcoded (completo)
const ITALY_AIRPORTS = [
  { code: 'FCO', name: 'Fiumicino', city: 'Roma' },
  { code: 'CIA', name: 'Ciampino', city: 'Roma' },
  { code: 'MXP', name: 'Malpensa', city: 'Milano' },
  { code: 'LIN', name: 'Linate', city: 'Milano' },
  { code: 'BGY', name: 'Orio al Serio', city: 'Bergamo / Milano' },
  { code: 'NAP', name: 'Capodichino', city: 'Napoli' },
  { code: 'CTA', name: 'Fontanarossa', city: 'Catania' },
  { code: 'PMO', name: 'Falcone Borsellino', city: 'Palermo' },
  { code: 'VCE', name: 'Marco Polo', city: 'Venezia' },
  { code: 'TSF', name: 'Treviso', city: 'Venezia / Treviso' },
  { code: 'BLQ', name: 'Marconi', city: 'Bologna' },
  { code: 'FLR', name: 'Peretola', city: 'Firenze' },
  { code: 'PSA', name: 'Galilei', city: 'Pisa / Firenze' },
  { code: 'BRI', name: 'Karol Wojtyla', city: 'Bari' },
  { code: 'BDS', name: 'Papola Casale', city: 'Brindisi' },
  { code: 'TRN', name: 'Caselle', city: 'Torino' },
  { code: 'GOA', name: 'Cristoforo Colombo', city: 'Genova' },
  { code: 'VRN', name: 'Catullo', city: 'Verona' },
  { code: 'SUF', name: 'Lamezia Terme', city: 'Lamezia Terme' },
  { code: 'REG', name: 'Tito Minniti', city: 'Reggio Calabria' },
  { code: 'CAG', name: 'Elmas', city: 'Cagliari' },
  { code: 'OLB', name: 'Costa Smeralda', city: 'Olbia' },
  { code: 'AHO', name: 'Fertilia', city: 'Alghero' },
  { code: 'TPS', name: 'Birgi', city: 'Trapani' },
  { code: 'CIY', name: 'Comiso', city: 'Ragusa' },
  { code: 'PNL', name: 'Pantelleria', city: 'Pantelleria' },
  { code: 'LMP', name: 'Lampedusa', city: 'Lampedusa' },
  { code: 'PMF', name: 'Giuseppe Verdi', city: 'Parma' },
  { code: 'VBS', name: 'Montichiari', city: 'Brescia' },
  { code: 'AOI', name: 'Falconara', city: 'Ancona' },
  { code: 'PEG', name: "Sant'Egidio", city: 'Perugia' },
  { code: 'QAJ', name: "D'Abruzzo", city: 'Pescara' },
  { code: 'BZO', name: 'Bolzano', city: 'Bolzano' },
  { code: 'TRS', name: 'Ronchi dei Legionari', city: 'Trieste' },
];

// Capitale per codice ISO2 → usata come termine di ricerca sull'API Travelpayouts
const CAPITALS = {
  AF: 'Kabul', AL: 'Tirana', DZ: 'Algiers', AD: 'Andorra la Vella', AO: 'Luanda',
  AG: 'Antigua', AR: 'Buenos Aires', AM: 'Yerevan', AU: 'Sydney', AT: 'Vienna',
  AZ: 'Baku', BS: 'Nassau', BH: 'Manama', BD: 'Dhaka', BB: 'Bridgetown',
  BY: 'Minsk', BE: 'Brussels', BZ: 'Belize City', BJ: 'Cotonou', BT: 'Paro',
  BO: 'La Paz', BA: 'Sarajevo', BW: 'Gaborone', BR: 'Sao Paulo', BN: 'Brunei',
  BG: 'Sofia', BF: 'Ouagadougou', BI: 'Bujumbura', CV: 'Praia', KH: 'Phnom Penh',
  CM: 'Yaounde', CA: 'Toronto', CF: 'Bangui', TD: 'Ndjamena', CL: 'Santiago',
  CN: 'Beijing', CO: 'Bogota', KM: 'Moroni', CD: 'Kinshasa', CG: 'Brazzaville',
  CR: 'San Jose', CI: 'Abidjan', HR: 'Zagreb', CU: 'Havana', CY: 'Larnaca',
  CZ: 'Prague', DK: 'Copenhagen', DJ: 'Djibouti', DM: 'Dominica', DO: 'Santo Domingo',
  EC: 'Quito', EG: 'Cairo', SV: 'San Salvador', GQ: 'Malabo', ER: 'Asmara',
  EE: 'Tallinn', SZ: 'Mbabane', ET: 'Addis Ababa', FJ: 'Nadi', FI: 'Helsinki',
  FR: 'Paris', GA: 'Libreville', GM: 'Banjul', GE: 'Tbilisi', DE: 'Frankfurt',
  GH: 'Accra', GR: 'Athens', GD: 'Grenada', GT: 'Guatemala City', GN: 'Conakry',
  GW: 'Bissau', GY: 'Georgetown', HT: 'Port-au-Prince', HN: 'Tegucigalpa',
  HU: 'Budapest', IS: 'Reykjavik', IN: 'Delhi', ID: 'Jakarta', IR: 'Tehran',
  IQ: 'Baghdad', IE: 'Dublin', IL: 'Tel Aviv', JM: 'Kingston', JP: 'Tokyo',
  JO: 'Amman', KZ: 'Almaty', KE: 'Nairobi', KI: 'Tarawa', KP: 'Pyongyang',
  KR: 'Seoul', KW: 'Kuwait', KG: 'Bishkek', LA: 'Vientiane', LV: 'Riga',
  LB: 'Beirut', LS: 'Maseru', LR: 'Monrovia', LY: 'Tripoli', LI: 'Vaduz',
  LT: 'Vilnius', LU: 'Luxembourg', MG: 'Antananarivo', MW: 'Lilongwe', MY: 'Kuala Lumpur',
  MV: 'Male', ML: 'Bamako', MT: 'Malta', MH: 'Majuro', MR: 'Nouakchott',
  MU: 'Mauritius', MX: 'Mexico City', FM: 'Pohnpei', MD: 'Chisinau', MC: 'Monaco',
  MN: 'Ulaanbaatar', ME: 'Podgorica', MA: 'Casablanca', MZ: 'Maputo', MM: 'Yangon',
  NA: 'Windhoek', NR: 'Nauru', NP: 'Kathmandu', NL: 'Amsterdam', NZ: 'Auckland',
  NI: 'Managua', NE: 'Niamey', NG: 'Lagos', MK: 'Skopje', NO: 'Oslo',
  OM: 'Muscat', PK: 'Karachi', PW: 'Koror', PA: 'Panama City', PG: 'Port Moresby',
  PY: 'Asuncion', PE: 'Lima', PH: 'Manila', PL: 'Warsaw', PT: 'Lisbon',
  QA: 'Doha', RO: 'Bucharest', RU: 'Moscow', RW: 'Kigali', KN: 'Saint Kitts',
  LC: 'Saint Lucia', VC: 'Saint Vincent', WS: 'Apia', SM: 'San Marino',
  ST: 'Sao Tome', SA: 'Riyadh', SN: 'Dakar', RS: 'Belgrade', SC: 'Mahe',
  SL: 'Freetown', SG: 'Singapore', SK: 'Bratislava', SI: 'Ljubljana', SB: 'Honiara',
  SO: 'Mogadishu', ZA: 'Johannesburg', SS: 'Juba', ES: 'Madrid', LK: 'Colombo',
  SD: 'Khartoum', SR: 'Paramaribo', SE: 'Stockholm', CH: 'Zurich', SY: 'Damascus',
  TW: 'Taipei', TJ: 'Dushanbe', TZ: 'Dar es Salaam', TH: 'Bangkok', TL: 'Dili',
  TG: 'Lome', TO: 'Tonga', TT: 'Port of Spain', TN: 'Tunis', TR: 'Istanbul',
  TM: 'Ashgabat', UG: 'Entebbe', UA: 'Kyiv', AE: 'Dubai', GB: 'London',
  US: 'New York', UY: 'Montevideo', UZ: 'Tashkent', VU: 'Vanuatu', VE: 'Caracas',
  VN: 'Hanoi', YE: 'Sanaa', ZM: 'Lusaka', ZW: 'Harare',
};

export default function EsploraPage() {
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [airports, setAirports] = useState([]);
  const [loadingAirports, setLoadingAirports] = useState(false);

  const [chosenAirport, setChosenAirport] = useState(null);
  const [origin, setOrigin] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const handleCountrySelect = useCallback(async (name, iso2) => {
    setSelectedCountry(name);
    setChosenAirport(null);
    setAirports([]);
    setLoadingAirports(true);

    try {
      // Italia: lista completa hardcoded
      if (iso2 === 'IT') {
        setAirports(ITALY_AIRPORTS);
        setLoadingAirports(false);
        return;
      }

      // Tutti gli altri: cerca la capitale
      const capital = CAPITALS[iso2] || name;
      const res = await fetch(
        `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(capital)}&locale=it&types[]=airport`
      );
      if (res.ok) {
        const data = await res.json();
        setAirports(data.slice(0, 8));
      }
    } catch {
      setAirports([]);
    } finally {
      setLoadingAirports(false);
    }
  }, []);

  const handleAirportPick = (airport) => {
    setChosenAirport({ code: airport.code, name: airport.name });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!origin || !chosenAirport?.code || !departDate) return;
    const params = new URLSearchParams({ from: origin, to: chosenAirport.code, date: departDate });
    if (isRoundTrip && returnDate) {
      params.set('retDate', returnDate);
      params.set('rt', '1');
    }
    router.push(`/?${params.toString()}`);
  };

  const closeAll = () => {
    setSelectedCountry(null);
    setChosenAirport(null);
    setAirports([]);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', background: '#000011', overflow: 'hidden' }}>

      {/* Titolo overlay */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        textAlign: 'center',
        pointerEvents: 'none',
        width: 'max-content',
        maxWidth: '90vw',
      }}>
        <h1 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 2rem)', fontWeight: 700, color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.9)', margin: 0 }}>
          Scegli la destinazione che ti ispira
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '0.4rem', textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
          Clicca su una nazione per vedere gli aeroporti
        </p>
      </div>

      {/* Globo */}
      <div style={{ width: '100%', height: '100%', cursor: 'grab' }}>
        <GlobeDynamic onCountrySelect={handleCountrySelect} />
      </div>

      {/* Pannello laterale */}
      {selectedCountry && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(360px, 92vw)',
          zIndex: 400,
          background: 'linear-gradient(180deg, rgba(36,0,70,0.97) 0%, rgba(18,0,40,0.99) 100%)',
          borderLeft: '1px solid rgba(224,170,255,0.2)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(224,170,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>
                Destinazione
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                {selectedCountry}
              </div>
            </div>
            <button type="button" onClick={closeAll} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1rem', cursor: 'pointer', flexShrink: 0, marginTop: '0.25rem' }}>
              ×
            </button>
          </div>

          {/* Lista aeroporti */}
          {!chosenAirport && (
            <div style={{ padding: '0.75rem 1.25rem', flex: 1 }}>
              {loadingAirports ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', padding: '1rem 0' }}>
                  Caricamento aeroporti...
                </div>
              ) : airports.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.88rem', padding: '1rem 0' }}>
                  Nessun aeroporto trovato.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                    {airports.length} aeroporto{airports.length !== 1 ? 'i' : ''} disponibile{airports.length !== 1 ? 'i' : ''}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {airports.map((ap) => {
                      const cityLabel = ap.city || ap.city_name || null;
                      return (
                        <button
                          key={ap.code}
                          type="button"
                          onClick={() => handleAirportPick(ap)}
                          style={{
                            padding: '0.7rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(224,170,255,0.15)',
                            background: 'rgba(255,255,255,0.04)',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'background 0.15s, border-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(157,78,221,0.2)';
                            e.currentTarget.style.borderColor = 'rgba(224,170,255,0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.borderColor = 'rgba(224,170,255,0.15)';
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', minWidth: 0 }}>
                            {cityLabel && (
                              <span style={{ fontSize: '0.72rem', color: 'rgba(224,170,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                {cityLabel}
                              </span>
                            )}
                            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{ap.name}</span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: '#e0aaff', fontWeight: 700, flexShrink: 0 }}>{ap.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Form dopo selezione aeroporto */}
          {chosenAirport && (
            <div style={{ padding: '0.75rem 1.25rem', flex: 1 }}>
              <button
                type="button"
                onClick={() => setChosenAirport(null)}
                style={{ fontSize: '0.8rem', color: 'rgba(224,170,255,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                ← Cambia aeroporto
              </button>

              <div style={{ padding: '0.7rem 1rem', background: 'rgba(157,78,221,0.15)', border: '1px solid rgba(224,170,255,0.3)', borderRadius: '12px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(224,170,255,0.7)', marginBottom: '0.15rem' }}>Voli verso</div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{chosenAirport.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#e0aaff' }}>{chosenAirport.code}</div>
              </div>

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'visible' }}>
                  <AutocompleteInput
                    id="globe-origin"
                    label="Partenza"
                    placeholder="Da dove parti?"
                    value={origin}
                    onChange={setOrigin}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', padding: '5px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {[['Solo andata', false], ['A/R', true]].map(([label, val]) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setIsRoundTrip(val)}
                      style={{
                        flex: 1, padding: '0.45rem', borderRadius: '10px', border: 'none',
                        background: isRoundTrip === val ? 'rgba(255,255,255,0.18)' : 'transparent',
                        color: '#fff', fontSize: '0.82rem', fontWeight: isRoundTrip === val ? 600 : 400,
                        cursor: 'pointer', transition: 'background 0.2s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ padding: '0 0.8rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Andata</span>
                  <MiniDatePicker value={departDate} onChange={(d) => { setDepartDate(d); if (returnDate && d > returnDate) setReturnDate(''); }} />
                </div>

                {isRoundTrip && (
                  <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '0 0.8rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Ritorno</span>
                    <MiniDatePicker value={returnDate} onChange={setReturnDate} minDate={departDate || undefined} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!origin || !departDate}
                  style={{
                    padding: '0.85rem', borderRadius: '999px',
                    background: 'linear-gradient(135deg, #9d4edd, #6e28b4)',
                    border: '1px solid rgba(224,170,255,0.5)',
                    color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(157,78,221,0.4)',
                    opacity: (!origin || !departDate) ? 0.5 : 1,
                    transition: 'opacity 0.2s', marginTop: '0.25rem',
                  }}
                >
                  Cerca voli →
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
