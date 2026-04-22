'use client';

import { useState } from 'react';
import styles from '../page.module.css';
import AutocompleteInput from './AutocompleteInput';
import MiniDatePicker from './MiniDatePicker';
import MiniRangePicker from './MiniRangePicker';
import PageHeader from './PageHeader';

interface ComboFlight {
  origin: string;
  adults: number;
  flight: {
    outbound: {
      from: string;
      to: string;
      cityFrom: string;
      cityTo: string;
      departLocal: string;
      arriveLocal: string;
      durationMinutes: number;
      layovers: string[];
    };
    return?: {
      from: string;
      to: string;
      cityFrom: string;
      cityTo: string;
      departLocal: string;
      arriveLocal: string;
      durationMinutes: number;
      layovers: string[];
    };
    price: number;
    currency: string;
    deepLink: string;
  };
}

interface Combo {
  date: string;
  flights: ComboFlight[];
  totalPrice: number;
  arrivalGapMinutes: number;
  score: number;
}

function toDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const t = iso.split('T')[1] ?? '';
  return t.slice(0, 5);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatGap(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

interface OriginEntry {
  code: string;
  adults: number;
}

export default function MultiDepartureSearch() {
  const [origins, setOrigins] = useState<OriginEntry[]>([
    { code: '', adults: 1 },
    { code: '', adults: 1 },
  ]);
  const [destination, setDestination] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [dateMode, setDateMode] = useState<'exact' | 'flex3' | 'range'>('exact');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departDateEnd, setDepartDateEnd] = useState('');
  const [returnDateEnd, setReturnDateEnd] = useState('');
  const [priority, setPriority] = useState<'price' | 'sync'>('price');
  const [directOnly, setDirectOnly] = useState(false);

  const countChunks = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = Date.parse(start);
    const e = Date.parse(end);
    if (!s || !e || e < s) return 1;
    const days = Math.round((e - s) / 86400000) + 1;
    return Math.ceil(days / 4);
  };

  const activeOrigins = origins.filter((o) => o.code.trim()).length || origins.length;
  const outChunks = dateMode === 'range' ? countChunks(departDate, departDateEnd) : 1;
  const retChunks = isRoundTrip && dateMode === 'range' ? countChunks(returnDate, returnDateEnd) : 1;
  const estimatedCalls = activeOrigins * outChunks * retChunks;
  const overCap = estimatedCalls > 50;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const updateOriginCode = (i: number, val: string) => {
    setOrigins((prev) => prev.map((o, idx) => (idx === i ? { ...o, code: val } : o)));
  };
  const updateOriginAdults = (i: number, val: number) => {
    setOrigins((prev) => prev.map((o, idx) => (idx === i ? { ...o, adults: Math.max(1, Math.min(9, val)) } : o)));
  };
  const addOrigin = () => {
    if (origins.length >= 6) return;
    setOrigins((prev) => [...prev, { code: '', adults: 1 }]);
  };
  const removeOrigin = (i: number) => {
    if (origins.length <= 2) return;
    setOrigins((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrigins = origins
      .map((o) => ({ code: o.code.trim(), adults: o.adults }))
      .filter((o) => o.code);
    if (cleanOrigins.length < 2) {
      setError('Inserisci almeno 2 aeroporti di partenza.');
      return;
    }
    if (!destination.trim() || !departDate) {
      setError('Inserisci destinazione e data di partenza.');
      return;
    }
    if (isRoundTrip && !returnDate) {
      setError('Inserisci la data di ritorno.');
      return;
    }
    if (dateMode === 'range') {
      if (!departDateEnd) {
        setError('Inserisci la fine del range di andata.');
        return;
      }
      if (isRoundTrip && !returnDateEnd) {
        setError('Inserisci la fine del range di ritorno.');
        return;
      }
      if (overCap) {
        setError(`Range troppo ampio: ${estimatedCalls} chiamate stimate (max 50). Restringi il periodo o riduci gli aeroporti.`);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setCombos([]);
    setHasSearched(true);

    try {
      const res = await fetch('/api/flights/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origins: cleanOrigins,
          destination: destination.trim(),
          dateMode,
          departureDate: toDDMMYYYY(departDate),
          departureDateEnd: dateMode === 'range' && departDateEnd ? toDDMMYYYY(departDateEnd) : undefined,
          returnDate: isRoundTrip && returnDate ? toDDMMYYYY(returnDate) : undefined,
          returnDateEnd: isRoundTrip && dateMode === 'range' && returnDateEnd ? toDDMMYYYY(returnDateEnd) : undefined,
          priority,
          directOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nella ricerca');
      setCombos(data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore di connessione';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* bgImage="/headers/multi-partenze.jpg" — aggiungi la tua immagine quando pronta */}
      <PageHeader
        title="Multi-Partenze"
        description="Parti insieme ai tuoi amici, parenti o partner anche se siete in città diverse. Inserisci fino a 6 aeroporti e trova le combinazioni migliori per prezzo o per arrivare tutti quasi insieme."
      />
      <section className={styles.heroSection} style={{ paddingTop: '2rem', backgroundImage: 'none', background: 'transparent' }}>
        <div className={`${styles.searchContainer} delay-100 animate-fade-in`}>
          <div className={styles.searchClassicBox}>
            <form className={styles.searchFormClassic} onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', textAlign: 'left' }}>
                  Aeroporti di partenza ({origins.length}/6)
                </div>
                {origins.map((o, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    <div className={styles.inputGroupBox} style={{ flex: 1, alignItems: 'stretch' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <AutocompleteInput
                          id={`origin-${i}`}
                          label={`Aeroporto ${i + 1}`}
                          placeholder="Città di partenza"
                          value={o.code}
                          onChange={(v) => updateOriginCode(i, v)}
                          required
                        />
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0 0.9rem',
                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.85)',
                        whiteSpace: 'nowrap',
                      }}>
                        <span aria-hidden style={{ fontSize: '0.95rem' }}>👤</span>
                        <input
                          type="number"
                          min="1"
                          max="9"
                          value={o.adults}
                          onChange={(e) => updateOriginAdults(i, parseInt(e.target.value, 10) || 1)}
                          aria-label={`Persone aeroporto ${i + 1}`}
                          style={{
                            width: '42px',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                          }}
                        />
                      </div>
                    </div>
                    {origins.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOrigin(i)}
                        aria-label="Rimuovi aeroporto"
                        style={{
                          width: '42px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(0,0,0,0.25)',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {origins.length < 6 && (
                  <button
                    type="button"
                    onClick={addOrigin}
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(224,170,255,0.4)',
                      background: 'transparent',
                      color: 'var(--secondary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    + Aggiungi partenza
                  </button>
                )}
              </div>

              <div className={styles.searchRow} style={{ marginTop: '1rem' }}>
                <div className={styles.inputGroupBox}>
                  <AutocompleteInput
                    id="multi-destination"
                    label="Destinazione"
                    placeholder="Dove volete andare?"
                    value={destination}
                    onChange={setDestination}
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem', textAlign: 'left' }}>Opzioni</div>
                <div className={styles.segmentedControl}>
                  <div className={styles.slideIndicator} style={{ transform: isRoundTrip ? 'translateX(100%)' : 'translateX(0%)' }} />
                  <button type="button" className={`${styles.segmentBtn} ${!isRoundTrip ? styles.activeText : ''}`} onClick={() => setIsRoundTrip(false)}>Andata</button>
                  <button type="button" className={`${styles.segmentBtn} ${isRoundTrip ? styles.activeText : ''}`} onClick={() => setIsRoundTrip(true)}>A/R</button>
                </div>
                {isRoundTrip && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.35rem', textAlign: 'left' }}>
                    Ogni persona tornerà nel proprio aeroporto di origine.
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem', textAlign: 'left' }}>Flessibilità date</div>
                <div style={{
                  display: 'flex',
                  gap: '0.4rem',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '6px',
                  borderRadius: '18px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  {(['exact', 'flex3', 'range'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDateMode(m)}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.5rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: dateMode === m ? 'rgba(255,255,255,0.2)' : 'transparent',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: dateMode === m ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {m === 'exact' ? 'Data esatta' : m === 'flex3' ? '± 3 giorni' : 'Range'}
                    </button>
                  ))}
                </div>
                {dateMode === 'flex3' && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.35rem', textAlign: 'left' }}>
                    Cerchiamo fino a 3 giorni prima/dopo le date scelte.
                  </div>
                )}
                {dateMode === 'range' && (
                  <div style={{ fontSize: '0.75rem', color: overCap ? '#fbbf24' : 'rgba(255,255,255,0.55)', marginTop: '0.35rem', textAlign: 'left' }}>
                    Chiamate stimate: {estimatedCalls}/50 {overCap && '— riduci il range'}
                  </div>
                )}
              </div>

              <div className={styles.searchRow} style={{ marginTop: '0.75rem' }}>
                {dateMode === 'range' ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', minWidth: '70px' }}>Andata</span>
                      <div style={{ flex: 1 }}>
                        <MiniRangePicker
                          startDate={departDate}
                          endDate={departDateEnd}
                          onChangeStart={(d) => { setDepartDate(d); if (departDateEnd && d > departDateEnd) setDepartDateEnd(''); }}
                          onChangeEnd={setDepartDateEnd}
                          className={styles.inputField}
                        />
                      </div>
                    </div>
                    {isRoundTrip && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', minWidth: '70px' }}>Ritorno</span>
                        <div style={{ flex: 1 }}>
                          <MiniRangePicker
                            startDate={returnDate}
                            endDate={returnDateEnd}
                            onChangeStart={(d) => { setReturnDate(d); if (returnDateEnd && d > returnDateEnd) setReturnDateEnd(''); }}
                            onChangeEnd={setReturnDateEnd}
                            className={styles.inputField}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ width: '100%', display: 'flex' }}>
                    <div className={styles.inputGroup} style={{ width: '100%' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 0.9rem',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                      }}>
                        Andata
                      </span>
                      <MiniDatePicker value={departDate} onChange={(d) => { setDepartDate(d); if (returnDate && d > returnDate) setReturnDate(''); }} className={styles.inputField} />
                      {isRoundTrip && (
                        <>
                          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 0.9rem',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                          }}>
                            Ritorno
                          </span>
                          <MiniDatePicker value={returnDate} onChange={setReturnDate} minDate={departDate || undefined} className={styles.inputField} />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem', textAlign: 'left' }}>Voli</div>
                <div className={styles.segmentedControl}>
                  <div className={styles.slideIndicator} style={{ transform: directOnly ? 'translateX(100%)' : 'translateX(0%)' }} />
                  <button type="button" className={`${styles.segmentBtn} ${!directOnly ? styles.activeText : ''}`} onClick={() => setDirectOnly(false)}>Con scalo</button>
                  <button type="button" className={`${styles.segmentBtn} ${directOnly ? styles.activeText : ''}`} onClick={() => setDirectOnly(true)}>Solo diretti</button>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem', textAlign: 'left' }}>Ordina per</div>
                <div className={styles.segmentedControl}>
                  <div className={styles.slideIndicator} style={{ transform: priority === 'sync' ? 'translateX(100%)' : 'translateX(0%)' }} />
                  <button type="button" className={`${styles.segmentBtn} ${priority === 'price' ? styles.activeText : ''}`} onClick={() => setPriority('price')}>Prezzo</button>
                  <button type="button" className={`${styles.segmentBtn} ${priority === 'sync' ? styles.activeText : ''}`} onClick={() => setPriority('sync')}>Sincrono</button>
                </div>
              </div>

              <div className={styles.buttonRow}>
                <button type="submit" className={styles.searchBtnBox} disabled={isLoading}>
                  {isLoading ? '...' : 'Trova combinazioni'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="container" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {isLoading && <div className={styles.loader}></div>}

        {!isLoading && error && (
          <div className={`${styles.emptyState} animate-fade-in`}>
            <h3>Ops!</h3>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && hasSearched && !error && combos.length === 0 && (
          <div className={styles.emptyState}>
            Nessuna combinazione trovata. Prova a cambiare le date o gli aeroporti.
          </div>
        )}

        {!isLoading && combos.length > 0 && (
          <section className={`${styles.resultsList} animate-fade-in delay-200`} style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            {combos.map((c, idx) => (
              <div key={idx} className={styles.flightCard} style={{ padding: '1.25rem', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Opzione {idx + 1}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>📅 {formatDate(c.date)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Finestra arrivi</div>
                      <div style={{ fontWeight: 600, color: c.arrivalGapMinutes < 120 ? '#86efac' : '#fbbf24' }}>
                        {c.arrivalGapMinutes === 0 ? 'Stesso orario' : formatGap(c.arrivalGapMinutes)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Totale</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--secondary)' }}>€{c.totalPrice}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {c.flights.map((f, i) => (
                    <div key={i} style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: f.flight.return ? '0.5rem' : 0 }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          Da {f.origin} · <span aria-hidden>👤</span> {f.adults}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>€{Math.round(f.flight.price)}</div>
                          <a href={f.flight.deepLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
                            Prenota
                          </a>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>🛫 Andata</div>
                          <div style={{ fontWeight: 600 }}>
                            {f.flight.outbound.from} → {f.flight.outbound.to}
                            {f.flight.outbound.layovers.length > 0 && (
                              <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.5rem' }}>
                                via {f.flight.outbound.layovers.join(', ')}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.75 }}>
                            {formatTime(f.flight.outbound.departLocal)} → {formatTime(f.flight.outbound.arriveLocal)} · {Math.round(f.flight.outbound.durationMinutes / 60)}h {f.flight.outbound.durationMinutes % 60}min
                          </div>
                        </div>

                        {f.flight.return && (
                          <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                            <div style={{ fontSize: '0.72rem', opacity: 0.55 }}>🛬 Ritorno</div>
                            <div style={{ fontWeight: 600 }}>
                              {f.flight.return.from} → {f.flight.return.to}
                              {f.flight.return.layovers.length > 0 && (
                                <span style={{ fontSize: '0.75rem', opacity: 0.7, marginLeft: '0.5rem' }}>
                                  via {f.flight.return.layovers.join(', ')}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.75 }}>
                              {formatTime(f.flight.return.departLocal)} → {formatTime(f.flight.return.arriveLocal)} · {Math.round(f.flight.return.durationMinutes / 60)}h {f.flight.return.durationMinutes % 60}min
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
