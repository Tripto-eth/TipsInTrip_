'use client';

import { useState } from 'react';
import AutocompleteInput from './AutocompleteInput';
import MiniDatePicker from './MiniDatePicker';

interface SearchFormCompactProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
}

function toDDMMYYYY(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function SearchFormCompact({ onSubmit, disabled }: SearchFormCompactProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [flexDays, setFlexDays] = useState<0 | 1 | 2 | 3>(0);
  const [adults, setAdults] = useState(1);
  const [directOnly, setDirectOnly] = useState(false);

  const canSubmit = origin && destination && departDate && (!isRoundTrip || returnDate);

  const buildPrompt = () => {
    const parts: string[] = [];
    parts.push(`da ${origin}`);
    parts.push(`a ${destination}`);
    parts.push(`andata ${toDDMMYYYY(departDate)}`);
    if (isRoundTrip && returnDate) parts.push(`ritorno ${toDDMMYYYY(returnDate)}`);
    if (flexDays > 0) parts.push(`flessibilità ±${flexDays} giorn${flexDays > 1 ? 'i' : 'o'} su entrambe le date`);
    parts.push(`${adults} adult${adults > 1 ? 'i' : 'o'}`);
    if (directOnly) parts.push('solo voli diretti');
    return `Cerca voli: ${parts.join(', ')}.`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || disabled) return;
    onSubmit(buildPrompt());
  };

  const chipStyle: React.CSSProperties = {
    flex: '1 1 auto',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '0.82rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const activeChipStyle: React.CSSProperties = {
    ...chipStyle,
    background: 'var(--primary)',
    border: '1px solid var(--primary)',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        padding: '0.85rem',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <AutocompleteInput
            id="compact-origin"
            label="Partenza"
            placeholder="Da dove parti?"
            value={origin}
            onChange={setOrigin}
            required
          />
        </div>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <AutocompleteInput
            id="compact-destination"
            label="Destinazione"
            placeholder="Dove vuoi andare?"
            value={destination}
            onChange={setDestination}
            required
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button
          type="button"
          style={isRoundTrip ? chipStyle : activeChipStyle}
          onClick={() => setIsRoundTrip(false)}
        >
          Solo andata
        </button>
        <button
          type="button"
          style={isRoundTrip ? activeChipStyle : chipStyle}
          onClick={() => setIsRoundTrip(true)}
        >
          Andata + ritorno
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
          <MiniDatePicker
            value={departDate}
            onChange={(d) => {
              setDepartDate(d);
              if (returnDate && d > returnDate) setReturnDate('');
            }}
            label="Andata"
          />
        </div>
        {isRoundTrip && (
          <div style={{ flex: '1 1 160px', minWidth: 0 }}>
            <MiniDatePicker
              value={returnDate}
              onChange={setReturnDate}
              minDate={departDate || undefined}
              label="Ritorno"
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginRight: '0.25rem' }}>
          Flessibilità date:
        </span>
        {([0, 1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setFlexDays(n)}
            style={flexDays === n ? activeChipStyle : chipStyle}
          >
            {n === 0 ? 'Esatte' : `±${n}g`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.7rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.8)',
        }}>
          Adulti
          <input
            type="number"
            min={1}
            max={9}
            value={adults}
            onChange={(e) => setAdults(Math.max(1, Math.min(9, Number(e.target.value) || 1)))}
            style={{
              width: '44px',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.9rem',
              textAlign: 'center',
              outline: 'none',
            }}
          />
        </label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.7rem',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '0.82rem',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={directOnly}
            onChange={(e) => setDirectOnly(e.target.checked)}
            style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
          />
          Solo voli diretti
        </label>
        <button
          type="submit"
          disabled={!canSubmit || disabled}
          style={{
            marginLeft: 'auto',
            padding: '0.55rem 1.1rem',
            borderRadius: '10px',
            border: 'none',
            background: !canSubmit || disabled ? 'rgba(255,255,255,0.1)' : 'var(--primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.88rem',
            cursor: !canSubmit || disabled ? 'default' : 'pointer',
          }}
        >
          Chiedi all&apos;AI
        </button>
      </div>
    </form>
  );
}
