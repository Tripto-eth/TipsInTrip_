'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import MiniRangePicker from './MiniRangePicker';
import MiniDatePicker from './MiniDatePicker';
import AnimatedLogo from './AnimatedLogo';
import AutocompleteInput from './AutocompleteInput';
import { useLang } from '../context/LanguageContext';

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
        <div className={styles.airlineInfo}>
          <span className={styles.airlineName}>🏷️ {flight.airline}</span>
        </div>

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
  const [isSpecificDate, setIsSpecificDate] = useState(false);

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
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);
    setFlights([]); 

    try {
      const params = new URLSearchParams();
      params.append('origin', origin);
      if (destination) params.append('destination', destination);
      params.append('isRoundTrip', isRoundTrip.toString());
      params.append('isSpecificDate', isSpecificDate.toString());
      if (directOnly) params.append('directOnly', 'true');
      if (maxPrice && parseInt(maxPrice, 10) > 0) params.append('maxPrice', maxPrice);

      // Applicazione Logica 4 Rami
      if (isSpecificDate) {
        if (exactDepartDate) params.append('exactDepartDate', exactDepartDate);
        if (isRoundTrip && exactReturnDate) {
          params.append('exactReturnDate', exactReturnDate);
        }
      } else {
        // Range Flessibili (Date Da-A)
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

        <section className={styles.heroSection}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Link href="/" aria-label="Home TipsinTrip" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <AnimatedLogo size={140} />
            </Link>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <Link
                href="/chat"
                className={styles.navLink}
                aria-label="Vai alla chat AI"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, rgba(157,78,221,0.25), rgba(224,170,255,0.18))',
                  border: '1px solid rgba(224,170,255,0.4)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  whiteSpace: 'nowrap',
                  fontSize: '0.82rem',
                }}
              >
                <span aria-hidden>✨</span>
                <span>{t.hero.aiLabel}</span>
              </Link>
              <div
                aria-hidden
                className="ai-badge-doodle"
                style={{
                  position: 'absolute',
                  left: 'calc(100% + 0.6rem)',
                  top: 0,
                  transform: 'translateY(-35%) rotate(6deg)',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontFamily: "'Caveat', 'Bradley Hand', 'Segoe Script', cursive",
                  fontSize: '2.1rem',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: 'var(--secondary)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  opacity: 0.95,
                }}
              >
                <svg
                  width="72"
                  height="50"
                  viewBox="0 0 40 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M38 14 C 30 4, 16 4, 4 14" />
                  <path d="M4 14 L 10 9" />
                  <path d="M4 14 L 10 19" />
                </svg>
                <span>{t.hero.aiDoodle}</span>
              </div>
            </div>
            <Link
              href="/globe"
              className={styles.navLink}
              aria-label="Ispirami"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgba(0,120,80,0.25), rgba(100,220,160,0.15))',
                border: '1px solid rgba(100,220,160,0.35)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                whiteSpace: 'nowrap',
                fontSize: '0.82rem',
                marginTop: '0.5rem',
              }}
            >
              <span aria-hidden>🌍</span>
              <span>{t.hero.inspireLabel}</span>
            </Link>
          </div>
          <h1 className={styles.heroTitle}>
            {t.hero.title}{" "}
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
          <div className={styles.heroPromises} style={{ fontWeight: 400, lineHeight: 1.5, opacity: 0.9 }}>
            <div>{t.hero.promise1}</div>
            <div>{t.hero.promise2}</div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.95rem' }}>
              {t.hero.hint}<strong style={{ color: 'var(--primary-hover)' }}>{t.hero.hintExample1}</strong>{t.hero.hintOr}<strong style={{ color: 'var(--primary-hover)' }}>{t.hero.hintExample2}</strong>
            </div>
          </div>

          <div className={`${styles.searchContainer} delay-100 animate-fade-in`}>
            <div className={styles.searchClassicBox}>
              <form className={styles.searchFormClassic} onSubmit={handleSearch}>
                
                {/* FILTRI TOP: A/R, Date Flessibili */}
                <div className={styles.topFiltersContainer} style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <div className={styles.segmentedControl}>
                    <div className={styles.slideIndicator} style={{ transform: isRoundTrip ? 'translateX(100%)' : 'translateX(0%)' }} />
                    <button type="button" className={`${styles.segmentBtn} ${!isRoundTrip ? styles.activeText : ''}`} onClick={() => setIsRoundTrip(false)}>{t.search.oneWay}</button>
                    <button type="button" className={`${styles.segmentBtn} ${isRoundTrip ? styles.activeText : ''}`} onClick={() => setIsRoundTrip(true)}>{t.search.roundTrip}</button>
                  </div>

                  <div className={styles.segmentedControl}>
                    <div className={styles.slideIndicator} style={{ transform: isSpecificDate ? 'translateX(100%)' : 'translateX(0%)' }} />
                    <button type="button" className={`${styles.segmentBtn} ${!isSpecificDate ? styles.activeText : ''}`} onClick={() => setIsSpecificDate(false)}>{t.search.flexMonth}</button>
                    <button type="button" className={`${styles.segmentBtn} ${isSpecificDate ? styles.activeText : ''}`} onClick={() => setIsSpecificDate(true)}>{t.search.exactDate}</button>
                  </div>
                </div>

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
                    />
                  </div>

                  {/* Date Start */}
                  <div className={styles.compactInputItem}>
                    {isSpecificDate ? (
                      <MiniDatePicker value={exactDepartDate} onChange={(d) => { setExactDepartDate(d); if (exactReturnDate && d > exactReturnDate) setExactReturnDate(''); }} className={styles.inputField} label="Andata" />
                    ) : (
                      <MiniRangePicker startDate={flexDepartStart} endDate={flexDepartEnd} onChangeStart={setFlexDepartStart} onChangeEnd={setFlexDepartEnd} className={styles.inputField} label="Andata" />
                    )}
                  </div>

                  {/* Date End (A/R) */}
                  {isRoundTrip && (
                    <div className={styles.compactInputItem}>
                      {isSpecificDate ? (
                        <MiniDatePicker value={exactReturnDate} onChange={setExactReturnDate} minDate={exactDepartDate || undefined} className={styles.inputField} label="Ritorno" />
                      ) : (
                        <MiniRangePicker startDate={flexReturnStart} endDate={flexReturnEnd} onChangeStart={setFlexReturnStart} onChangeEnd={setFlexReturnEnd} className={styles.inputField} label="Ritorno" />
                      )}
                    </div>
                  )}

                  {/* Tasto Cerca (Integrato su Desktop) */}
                  <div className={`${styles.compactInputItem} ${styles.searchBtnCompactWrapper}`}>
                    <button type="submit" className={styles.searchBtnCompact} disabled={isLoading}>
                      {isLoading ? '...' : t.search.searchBtn}
                    </button>
                  </div>
                </div>

                {/* FILTRI BOTTOM: Solo Diretti, Prezzo Massimo */}
                <div className={styles.searchRow} style={{ gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
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
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{t.search.maxPrice}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="10"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="es. 300"
                      aria-label="Prezzo massimo in euro"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#fff',
                        fontSize: '0.9rem',
                        width: '80px',
                      }}
                    />
                  </div>
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

        {!isLoading && hasSearched && !error && (
          <section className={`${styles.resultsList} animate-fade-in delay-200`}>
            {flights.length > 0 ? (
              <>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255,255,255,0.55)',
                  textAlign: 'center',
                  padding: '0.5rem 1rem',
                  marginBottom: '0.5rem',
                  lineHeight: 1.5,
                }}>
                  {t.search.cacheNote}
                </div>
                {flights.map(flight => <FlightCardItem key={flight.id} flight={flight} />)}
              </>
            ) : (
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
