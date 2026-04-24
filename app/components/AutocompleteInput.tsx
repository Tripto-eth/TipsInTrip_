'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../page.module.css';

export interface Place {
  code: string;
  name: string;
  country_name: string;
  type: string;
}

interface AutocompleteInputProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  initialQuery?: string;
  /** Mostra "Ovunque" come primo suggerimento (solo per destinazioni) */
  allowAnywhere?: boolean;
}

const ANYWHERE_CODE = 'anywhere';
const ANYWHERE_ITALY_CODE = 'anywhere-italy';
const ANYWHERE_FOREIGN_CODE = 'anywhere-foreign';

const ANYWHERE_OPTIONS: Array<{
  code: string;
  label: string;
  subtitle: string;
  emoji: string;
}> = [
  { code: ANYWHERE_CODE, label: 'Ovunque', subtitle: 'Scegliamo i migliori risultati per te', emoji: '✨' },
  { code: ANYWHERE_ITALY_CODE, label: 'Ovunque in Italia', subtitle: 'Solo mete italiane', emoji: '🇮🇹' },
  { code: ANYWHERE_FOREIGN_CODE, label: 'Ovunque all’estero', subtitle: 'Solo mete estere', emoji: '🌍' },
];

export default function AutocompleteInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  required,
  initialQuery,
  allowAnywhere,
}: AutocompleteInputProps) {
  const [query, setQuery] = useState(initialQuery ?? value);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(
        `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(searchTerm)}&locale=it&types[]=city&types[]=airport&types[]=country`,
        { signal: controller.signal },
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.slice(0, 10));
        setIsOpen(true);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e);
    }
  };

  useEffect(() => {
    if (initialQuery && initialQuery.length >= 2) {
      setQuery(initialQuery);
      fetchSuggestions(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 250);
  };

  const handleSelect = (place: Place) => {
    let display = place.name;
    const anywhereOpt = ANYWHERE_OPTIONS.find((o) => o.code === place.code);
    if (anywhereOpt) {
      display = anywhereOpt.label;
    } else if (place.type === 'country') {
      display = `${place.name} (Tutti gli aeroporti)`;
    } else if (place.type === 'city') {
      display = `${place.name} (Tutti gli aeroporti)`;
    } else {
      display = `${place.name} (${place.code})`;
    }
    setQuery(display);
    onChange(place.code);
    setIsOpen(false);
  };

  return (
    <div style={{ flex: 1, width: '100%', position: 'relative' }} ref={wrapperRef}>
      <div className={styles.autocompleteContainer} style={{ height: '100%' }}>
        <input
          id={id}
          type="text"
          className={styles.inputField}
          placeholder={placeholder}
          aria-label={label}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0 || (allowAnywhere && query.length >= 1)) setIsOpen(true);
          }}
          required={required}
          autoComplete="off"
        />
        {isOpen && (suggestions.length > 0 || (allowAnywhere && query.length >= 1)) && (
          <div className={styles.dropdownList}>
            {allowAnywhere && query.length >= 1 && ANYWHERE_OPTIONS.map((opt) => (
              <div
                key={opt.code}
                className={styles.dropdownItem}
                onClick={() =>
                  handleSelect({
                    code: opt.code,
                    name: opt.label,
                    country_name: '',
                    type: 'anywhere',
                  })
                }
                style={{ background: 'linear-gradient(135deg, rgba(157,78,221,0.12), rgba(224,170,255,0.06))' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.cityName}>{opt.emoji} {opt.label}</span>
                  <span className={styles.countryName} style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                    {opt.subtitle}
                  </span>
                </div>
                <span className={styles.iataCode}>ANY</span>
              </div>
            ))}
            {suggestions.map((place) => (
              <div key={place.code} className={styles.dropdownItem} onClick={() => handleSelect(place)}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className={styles.cityName}>{place.name}</span>
                  <span className={styles.countryName} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    {place.type === 'country'
                      ? 'Tutti gli aeroporti del paese'
                      : place.type === 'city'
                        ? `Tutti gli aeroporti di ${place.name}`
                        : `${place.country_name}`}
                  </span>
                </div>
                <span className={styles.iataCode}>{place.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
