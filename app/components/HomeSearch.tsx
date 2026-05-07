'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import MiniRangePicker from './MiniRangePicker';
import MiniDatePicker from './MiniDatePicker';
import AnimatedLogo from './AnimatedLogo';
import AutocompleteInput from './AutocompleteInput';
import HomeAIBar from './HomeAIBar';
import GlobeLoader from './GlobeLoader';
import TourGuide from './TourGuide';
import { useLang } from '../context/LanguageContext';

const MAX_PRICE_OPTIONS = [25, 50, 75, 100, 150, 200];
const OPTION_STYLE = { background: '#1a0035', color: '#fff' };

interface Flight {
  id: string;
  route: string;
  airline: string;
  price: number;
  depart_date: string;
  return_date: string | null;
  isRoundTrip: boolean;
  duration_out_str: string;
  duration_back_str: string;
  stops_out: number;
  stops_back: number;
  deepLink: string;
}

function FlightCardItem({ flight }: { flight: Flight }) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDateStr = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const { t } = useLang();
  const stopsLabel = (n: number) => n === 0 ? t.results.direct : `${n} ${n > 1 ? t.results.stops : t.results.stop}`;

  return (
    <div className={styles.flightCard}>
      <div className={styles.flightMain}>
        <div className={styles.routeLocations}>{flight.route}</div>

        <div style={{ display: 'flex', gap: '1rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 140px',
            padding: '0.6rem 0.8rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.25rem' }}>{t.results.outbound}</div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatDateStr(flight.depart_date)}</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: '0.2rem' }}>
              {flight.duration_out_str || '—'} · {stopsLabel(flight.stops_out)}
            </div>
          </div>

          {flight.isRoundTrip && flight.return_date && (
            <div style={{
              flex: '1 1 140px',
              padding: '0.6rem 0.8rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.25rem' }}>{t.results.returnLabel}</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{formatDateStr(flight.return_date)}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: '0.2rem' }}>
                {flight.duration_back_str || '—'} · {stopsLabel(flight.stops_back)}
              </div>
            </div>
          )}
        </div>

        <div className={styles.flightDetailsAccordion}>
          <button className={styles.detailsToggle} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? t.results.hideDetails : t.results.showDetails} {isOpen ? '▲' : '▼'}
          </button>

          {isOpen && (
            <div className={styles.detailsContent}>
              <div className={styles.detailRow}>
                <span>{t.results.exactTimes}</span>
                <span style={{ color: 'orange' }}>{t.results.timesNote}</span>
              </div>
              <div className={styles.detailRow}>
                <span>{t.results.exactAirports}</span>
                <span style={{ color: 'orange' }}>{t.results.airportsNote}</span>
              </div>
              {flight.isRoundTrip && (
                <div className={styles.detailRow}>
                  <span>{t.results.priceType}</span>
                  <span>{t.results.priceTypeNote}</span>
                </div>
              )}
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                {t.results.clickNote}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.priceContainer}>
        <div className={styles.price}>€{flight.price}</div>
        <a href={flight.deepLink} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}>
          {t.results.buy}
        </a>
      </div>
    </div>
  );
}

export default function HomeSearch() {
  const { t } = useLang();
  const phrases = t.hero.phrases as readonly string[];
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (phraseIndex < phrases.length - 1) {
      const timer = setTimeout(() => {
        setPhraseIndex(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phraseIndex]);

  const handleHoverText = () => {
    // Se siamo arrivati alla fine, passandoci col mouse torna indietro random!
    if (phraseIndex === phrases.length - 1) {
      const randomIndex = Math.floor(Math.random() * (phrases.length - 1));
      setPhraseIndex(randomIndex);
    }
  };



  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [isSpecificDate, setIsSpecificDate] = useState(true);
  const [flexDays, setFlexDays] = useState(0);    // flex andata 0=esatta, 1/3/5=±gg
  const [retFlexDays, setRetFlexDays] = useState(0); // flex ritorno
  const [useNights, setUseNights] = useState(false);
  const [nightsToStay, setNightsToStay] = useState(7);
  const [departFlex, setDepartFlex] = useState(0);

  // STATI DATE FLESSIBILI (Range Da-A)
  const [flexDepartStart, setFlexDepartStart] = useState('');
  const [flexDepartEnd, setFlexDepartEnd] = useState('');
  const [flexReturnStart, setFlexReturnStart] = useState('');
  const [flexReturnEnd, setFlexReturnEnd] = useState('');

  // STATI DATE ESATTE (Singoli)
  const [exactDepartDate, setExactDepartDate] = useState('');
  const [exactReturnDate, setExactReturnDate] = useState('');

  // Pre-riempie il form se arriva da /globe con parametri URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from');
    const toParam = params.get('to');
    const dateParam = params.get('date');
    const retDateParam = params.get('retDate');
    const rtParam = params.get('rt');
    if (fromParam) setOrigin(fromParam);
    if (toParam) setDestination(toParam);
    if (dateParam) { setExactDepartDate(dateParam); setIsSpecificDate(true); }
    if (rtParam === '1') setIsRoundTrip(true);
    if (retDateParam) setExactReturnDate(retDateParam);
  }, []);

  const [directOnly, setDirectOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relaxedDirect, setRelaxedDirect] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stopsFilter, setStopsFilter] = useState<'all' | '0' | '1' | '2' | '2+'>('all');
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [mode, setMode] = useState<'classic' | 'ai'>('classic');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setFlights([]);
    setPage(1);
    setSortOrder('asc');
    setStopsFilter('all');
    setRelaxedDirect(false);

    try {
      const params = new URLSearchParams();
      params.append('origin', origin);

      // "Ovunque" ha 3 varianti: anywhere (tutto), anywhere-italy (solo Italia), anywhere-foreign (solo estero).
      // Normalizziamo: destination='anywhere' + scope dedicato per il backend.
      let destToSend = destination;
      if (destination === 'anywhere-italy') {
        destToSend = 'anywhere';
        params.append('anywhereScope', 'italy');
      } else if (destination === 'anywhere-foreign') {
        destToSend = 'anywhere';
        params.append('anywhereScope', 'foreign');
      }
      if (destToSend) params.append('destination', destToSend);

      params.append('isRoundTrip', (isRoundTrip || useNights).toString());
      params.append('isSpecificDate', isSpecificDate.toString());
      if (directOnly) params.append('directOnly', 'true');
      if (maxPrice && parseInt(maxPrice, 10) > 0) params.append('maxPrice', maxPrice);

      if (useNights) {
        // Modalità notti: data partenza + flex + notti soggiorno
        if (exactDepartDate) params.append('exactDepartDate', exactDepartDate);
        params.append('nightsToStay', nightsToStay.toString());
        params.append('departFlex', departFlex.toString());
      } else if (isSpecificDate && flexDays > 0) {
        if (exactDepartDate) params.append('exactDepartDate', exactDepartDate);
        params.append('departFlex', flexDays.toString());
        if (isRoundTrip && exactReturnDate) {
          params.append('exactReturnDate', exactReturnDate);
          if (retFlexDays > 0) params.append('returnFlex', retFlexDays.toString());
        }
      } else if (isSpecificDate) {
        if (exactDepartDate) params.append('exactDepartDate', exactDepartDate);
        if (isRoundTrip && exactReturnDate) {
          params.append('exactReturnDate', exactReturnDate);
        }
      } else {
        if (flexDepartStart) params.append('flexDepartStart', flexDepartStart);
        if (flexDepartEnd) params.append('flexDepartEnd', flexDepartEnd);
        if (isRoundTrip) {
          if (flexReturnStart) params.append('flexReturnStart', flexReturnStart);
          if (flexReturnEnd) params.append('flexReturnEnd', flexReturnEnd);
        }
      }
      
      const response = await fetch(`/api/flights?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Errore durante la ricerca');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFlights(data.data || []);
      setRelaxedDirect(Boolean(data.relaxed));
      
    } catch (err: unknown) {
      console.error('Error fetching flights:', err);
      const message = err instanceof Error ? err.message : '';
      setError(message || 'Errore di connessione o dati non trovati. Prova a cambiare i parametri.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      <TourGuide
        onExpandForm={() => setIsFormExpanded(true)}
        onActivateNotti={() => { setIsFormExpanded(true); setUseNights(true); setIsRoundTrip(true); setIsSpecificDate(true); }}
        onDeactivateNotti={() => { setUseNights(false); setIsRoundTrip(false); }}
      />

        <section className={styles.heroSection}>

          {/* LOGO centrato grande */}
          <div className={styles.heroCenterLogo}>
            <Link href="/" aria-label="Home TipsinTrip">
              <AnimatedLogo size={140} />
            </Link>
          </div>

          {/* HERO 2-COL: testo+form a sx, collage a dx */}
          <div className={styles.heroGrid}>

            {/* ── LEFT: contenuto + ricerca ── */}
            <div className={styles.heroLeft}>
          <h1 className={styles.heroHeadline}>
            {t.hero.title}<br />
            <span 
              className={`${styles.rotatingTextWrapper} ${phraseIndex === phrases.length - 1 ? styles.textPrimary : styles.textWhite}`}
              onMouseEnter={handleHoverText}
              style={{ cursor: phraseIndex === phrases.length - 1 ? 'pointer' : 'default', transition: 'all 0.3s' }}
            >
              {phrases[phraseIndex].split("").map((char, index) => (
                <span 
                  key={`${phraseIndex}-${index}`}
                  className={styles.letterAssemble}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
          </h1>
          <p className={styles.heroDesc}>
            {t.hero.promise1} {t.hero.promise2}
          </p>

          {/* Pillola switcher modalità */}
          <div className={styles.modeSwitcher}>
            <div className={styles.modeSwitcherPill}>
              <button
                type="button"
                className={`${styles.modeSwitcherBtn} ${mode === 'classic' ? styles.modeSwitcherActive : ''}`}
                onClick={() => setMode('classic')}
              >
                Classica
              </button>
              <button
                type="button"
                className={`${styles.modeSwitcherBtn} ${mode === 'ai' ? styles.modeSwitcherActive : ''}`}
                onClick={() => setMode('ai')}
              >
                ✨ Trip AI
              </button>
            </div>
          </div>

          <div style={{ minHeight: 420 }}>
          {mode === 'ai' && <HomeAIBar compact noDivider />}

          {mode === 'classic' && <div className={`${styles.searchContainer} delay-100 animate-fade-in`}>
            <div
              className={`${styles.searchClassicBox} ${(isFormExpanded || origin || destination || exactDepartDate || exactReturnDate || flexDepartStart) ? styles.searchClassicBoxActive : ''}`}
              onFocus={() => setIsFormExpanded(true)}
            >
              <form className={styles.searchFormClassic} onSubmit={handleSearch}>

                {/* FILTRI TOP: A/R, Date Flessibili */}
                {isFormExpanded && <div className={styles.topFiltersContainer} style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
                  {/* Trip type: 3 opzioni */}
                  <div id="tour-trip-type" className={styles.segmentedControl} style={{ '--seg-count': 3 } as React.CSSProperties}>
                    <div className={styles.slideIndicator} style={{ width: 'calc(100% / 3 - 4px)', transform: useNights ? 'translateX(200%)' : isRoundTrip ? 'translateX(100%)' : 'translateX(0%)' }} />
                    <button type="button" className={`${styles.segmentBtn} ${!isRoundTrip && !useNights ? styles.activeText : ''}`} onClick={() => { setIsRoundTrip(false); setUseNights(false); }}>{t.search.oneWay}</button>
                    <button type="button" className={`${styles.segmentBtn} ${isRoundTrip && !useNights ? styles.activeText : ''}`} onClick={() => { setIsRoundTrip(true); setUseNights(false); }}>{t.search.roundTrip}</button>
                    <button id="tour-notti-btn" type="button" className={`${styles.segmentBtn} ${useNights ? styles.activeText : ''}`} onClick={() => { setIsRoundTrip(true); setUseNights(true); setIsSpecificDate(true); }}>Notti</button>
                  </div>

                  {!useNights && <div id="tour-flessibile" className={styles.segmentedControl}>
                    <div className={styles.slideIndicator} style={{ transform: isSpecificDate ? 'translateX(0%)' : 'translateX(100%)' }} />
                    <button type="button" className={`${styles.segmentBtn} ${isSpecificDate ? styles.activeText : ''}`} onClick={() => setIsSpecificDate(true)}>{t.search.exactDate}</button>
                    <button type="button" className={`${styles.segmentBtn} ${!isSpecificDate ? styles.activeText : ''}`} onClick={() => setIsSpecificDate(false)}>{t.search.flexMonth}</button>
                  </div>}

                </div>}

                {/* PILLOLA CENTRALE COMPATTA */}
                <div className={styles.searchCompactBar}>
                  <div className={styles.compactInputItem}>
                    <AutocompleteInput
                      id="origin"
                      label={t.search.origin}
                      placeholder={t.search.originPlaceholder}
                      value={origin}
                      onChange={setOrigin}
                      required
                    />
                  </div>
                  
                  <div className={styles.compactInputItem}>
                    <AutocompleteInput
                      id="destination"
                      label={t.search.destination}
                      placeholder={t.search.destPlaceholder}
                      value={destination}
                      onChange={setDestination}
                      allowAnywhere
                    />
                  </div>

                  {/* Date partenza */}
                  {isFormExpanded && (
                  <div className={styles.compactInputItem}>
                    {isSpecificDate || useNights ? (
                      <MiniDatePicker value={exactDepartDate} onChange={(d) => { setExactDepartDate(d); if (exactReturnDate && d > exactReturnDate) setExactReturnDate(''); }} className={styles.inputField} label="Andata" flexDays={!useNights ? flexDays : undefined} onFlexChange={!useNights ? setFlexDays : undefined} />
                    ) : (
                      <MiniRangePicker startDate={flexDepartStart} endDate={flexDepartEnd} onChangeStart={setFlexDepartStart} onChangeEnd={setFlexDepartEnd} className={styles.inputField} label="Andata" />
                    )}
                  </div>
                  )}

                  {/* Flex giorni — solo in modalità notti */}
                  {isFormExpanded && useNights && (
                    <div className={styles.compactInputItem}>
                      <select
                        value={departFlex}
                        onChange={(e) => setDepartFlex(Number(e.target.value))}
                        aria-label="Flessibilità partenza"
                        style={{ background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', cursor: 'pointer', padding: '0.6rem 1rem', width: '100%' }}
                      >
                        {[0,1,2,3].map(d => (
                          <option key={d} value={d} style={{ background: '#1a0035' }}>{d === 0 ? 'Data esatta' : `±${d} gg`}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Data ritorno — solo A/R classico */}
                  {isFormExpanded && isRoundTrip && !useNights && (
                    <div className={styles.compactInputItem}>
                      {isSpecificDate ? (
                        <MiniDatePicker value={exactReturnDate} onChange={setExactReturnDate} minDate={exactDepartDate || undefined} className={styles.inputField} label="Ritorno" flexDays={retFlexDays} onFlexChange={setRetFlexDays} />
                      ) : (
                        <MiniRangePicker startDate={flexReturnStart} endDate={flexReturnEnd} onChangeStart={setFlexReturnStart} onChangeEnd={setFlexReturnEnd} className={styles.inputField} label="Ritorno" />
                      )}
                    </div>
                  )}

                  {/* Tasto Cerca (Integrato su Desktop) */}
                  <div className={`${styles.compactInputItem} ${styles.searchBtnCompactWrapper}`}>
                    {isFormExpanded ? (
                      <button type="submit" className={styles.searchBtnCompact} disabled={isLoading}>
                        {isLoading ? '...' : t.search.searchBtn}
                      </button>
                    ) : (
                      <button type="button" className={styles.searchBtnCompact} onClick={() => setIsFormExpanded(true)}>
                        {t.search.searchBtn}
                      </button>
                    )}
                  </div>
                </div>

                {/* NOTTI: slider 1-31 */}
                {isFormExpanded && useNights && (
                  <div style={{ width: '100%', padding: '0.25rem 0.25rem 0', marginTop: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Durata soggiorno</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#e0aaff' }}>
                        {nightsToStay} {nightsToStay === 1 ? 'notte' : 'notti'}
                      </span>
                    </div>
                    <input
                      id="tour-notti-slider"
                      type="range"
                      min={1}
                      max={31}
                      value={nightsToStay}
                      onChange={(e) => setNightsToStay(Number(e.target.value))}
                      aria-label="Numero di notti"
                      style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>1</span>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)' }}>31</span>
                    </div>
                  </div>
                )}

                {/* FILTRI BOTTOM: Solo Diretti, Prezzo Massimo */}
                {isFormExpanded && <div className={styles.searchRow} style={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s',
                  }}>
                    <input
                      type="checkbox"
                      checked={directOnly}
                      onChange={(e) => setDirectOnly(e.target.checked)}
                      style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                    {t.search.directOnly}
                  </label>


                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 1.2rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '999px',
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>Prezzo</span>
                    <select
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      aria-label="Prezzo massimo in euro"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: maxPrice ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        paddingRight: '0.25rem',
                      }}
                    >
                      <option value="" style={OPTION_STYLE}>Qualsiasi</option>
                      {MAX_PRICE_OPTIONS.map((v) => (
                        <option key={v} value={v} style={OPTION_STYLE}>€{v}</option>
                      ))}
                    </select>
                  </div>
                </div>}

              </form>
            </div>
          </div>}

          </div> {/* fine minHeight wrapper */}

            </div> {/* fine heroLeft */}
          </div> {/* fine heroGrid */}
        </section>

        <div className="container" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {isLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><GlobeLoader size={120} /></div>}

        {!isLoading && error && (
          <div className={`${styles.emptyState} animate-fade-in`}>
            <h3>Ops!</h3>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && hasSearched && !error && relaxedDirect && flights.length > 0 && (
          <div style={{
            padding: '0.7rem 1rem',
            marginBottom: '0.75rem',
            borderRadius: '10px',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.35)',
            color: '#fcd34d',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            ⚠️ Non abbiamo trovato voli diretti per questa ricerca. Ti mostriamo le opzioni disponibili (potrebbero avere scali).
          </div>
        )}

        {!isLoading && hasSearched && !error && (
          <section className={`${styles.resultsList} animate-fade-in delay-200`}>
            {flights.length > 0 ? (() => {
              // ── Filtro scali ──
              const filtered = stopsFilter === 'all' ? flights : flights.filter(f => {
                const s = f.stops_out;
                if (stopsFilter === '0') return s === 0;
                if (stopsFilter === '1') return s === 1;
                if (stopsFilter === '2') return s === 2;
                return s >= 2; // '2+'
              });

              // ── Ordina per prezzo ──
              const displayFlights = [...filtered].sort((a, b) =>
                sortOrder === 'asc' ? a.price - b.price : b.price - a.price
              );

              const chipBase: React.CSSProperties = {
                padding: '0.3rem 0.75rem', borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s',
              };
              const chipActive: React.CSSProperties = {
                ...chipBase,
                background: 'rgba(157,78,221,0.22)',
                border: '1px solid rgba(157,78,221,0.55)',
                color: '#c77dff', fontWeight: 700,
              };

              const PER_PAGE = 10;
              const totalPages = Math.ceil(displayFlights.length / PER_PAGE);
              const visible = displayFlights.slice(0, page * PER_PAGE);

              return (
                <>
                  {/* ── Barra filtri ── */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center',
                    marginBottom: '1rem', padding: '0.7rem 0.9rem',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    {/* Sort */}
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>Ordina:</span>
                    <button style={sortOrder === 'asc' ? chipActive : chipBase} onClick={() => { setSortOrder('asc'); setPage(1); }}>Prezzo ↑</button>
                    <button style={sortOrder === 'desc' ? chipActive : chipBase} onClick={() => { setSortOrder('desc'); setPage(1); }}>Prezzo ↓</button>

                    <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.1rem' }} />

                    {/* Stops filter */}
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>Scali:</span>
                    {(['all', '0', '1', '2', '2+'] as const).map(s => (
                      <button key={s} style={stopsFilter === s ? chipActive : chipBase} onClick={() => { setStopsFilter(s); setPage(1); }}>
                        {s === 'all' ? 'Tutti' : s === '0' ? 'Nessuno' : s === '1' ? '1 scalo' : s === '2' ? '2 scali' : '2+ scali'}
                      </button>
                    ))}
                  </div>

                  {/* ── Contatore ── */}
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '0.75rem' }}>
                    {displayFlights.length === 0
                      ? 'Nessun volo con questo filtro'
                      : `${visible.length} di ${displayFlights.length} voli`}
                  </div>

                  {displayFlights.length === 0 ? (
                    <div className={styles.emptyState} style={{ padding: '1.5rem' }}>
                      Nessun risultato per i filtri selezionati. Prova a cambiare gli scali o ordina diversamente.
                    </div>
                  ) : (
                    <>
                      {visible.map((flight, i) => <FlightCardItem key={`${flight.id}-${i}`} flight={flight} />)}
                      {page < totalPages && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
                          <button
                            onClick={() => setPage(p => p + 1)}
                            style={{
                              padding: '0.7rem 2rem', borderRadius: '999px',
                              background: 'rgba(157,78,221,0.2)', border: '1px solid rgba(157,78,221,0.45)',
                              color: '#c77dff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                            }}
                          >
                            Carica altri voli ({displayFlights.length - visible.length} rimanenti)
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })() : (
              <div className={styles.emptyState}>
                {t.results.noResults}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
