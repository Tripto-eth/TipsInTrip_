'use client';

import { useState, useRef, useEffect } from 'react';

interface MiniDatePickerProps {
  value: string;              // YYYY-MM-DD
  onChange: (d: string) => void;
  minDate?: string;           // YYYY-MM-DD
  className?: string;
  label?: string;
  placeholder?: string;
}

export default function MiniDatePicker({
  value,
  onChange,
  minDate,
  className,
  label,
  placeholder = 'Scegli data',
}: MiniDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Allinea il calendario al mese del valore quando cambia dall'esterno
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewMonth({ year: y, month: m - 1 });
    }
  }, [value]);

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const dayNames = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const prevMonth = () => {
    setViewMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewMonth(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const toDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDayClick = (day: number) => {
    const clicked = toDateStr(viewMonth.year, viewMonth.month, day);
    onChange(clicked);
    setIsOpen(false);
  };

  const isSelected = (day: number) => value === toDateStr(viewMonth.year, viewMonth.month, day);

  const isToday = (day: number) => {
    const now = new Date();
    return viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth() && day === now.getDate();
  };

  const isBeforeMin = (day: number) => {
    const d = toDateStr(viewMonth.year, viewMonth.month, day);
    if (minDate) return d < minDate;
    const today = new Date();
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    return d < todayStr;
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return label || placeholder;
    const [y, m, dd] = dateStr.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month);
  const firstDay = getFirstDayOfMonth(viewMonth.year, viewMonth.month);

  return (
    <div style={{ position: 'relative', flex: 1 }} ref={wrapperRef}>
      <div
        className={className}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          backgroundColor: 'transparent',
          color: '#fff',
          padding: '0 1rem',
          position: 'relative',
        }}
      >
        {label && (
          <span style={{ fontSize: '1.2rem', color: 'var(--primary)', opacity: 0.8, position: 'absolute', left: '1rem' }}>
            {label === 'Andata' ? '🛫' : label === 'Ritorno' ? '🛬' : label}
          </span>
        )}
        <span style={{ fontWeight: 500, whiteSpace: 'nowrap', color: value ? '#fff' : 'rgba(255,255,255,0.6)', margin: '0 auto' }}>
          {formatDisplay(value)}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999,
          background: 'rgba(36, 0, 70, 0.85)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          minWidth: '280px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
            <button type="button" onClick={prevMonth} style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}>◀</button>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              {monthNames[viewMonth.month]} {viewMonth.year}
            </span>
            <button type="button" onClick={nextMonth} style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#fff',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}>▶</button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '4px',
          }}>
            {dayNames.map(d => (
              <div key={d} style={{
                textAlign: 'center',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                padding: '2px 0',
              }}>{d}</div>
            ))}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
          }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isBeforeMin(day);
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && handleDayClick(day)}
                  style={{
                    width: '34px',
                    height: '34px',
                    border: 'none',
                    borderRadius: '50%',
                    background: selected ? 'var(--primary)' : 'transparent',
                    color: disabled
                      ? 'rgba(255,255,255,0.15)'
                      : selected
                        ? '#fff'
                        : '#fff',
                    cursor: disabled ? 'default' : 'pointer',
                    fontWeight: selected || today ? 700 : 400,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    outline: today && !selected ? '1px solid var(--primary)' : 'none',
                    margin: '0 auto',
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !selected) {
                      (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !selected) {
                      (e.target as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            marginTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '10px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { label: 'Oggi', days: 0 },
              { label: 'Domani', days: 1 },
              { label: '+7gg', days: 7 },
              { label: '+30gg', days: 30 },
            ].map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  const now = new Date();
                  now.setDate(now.getDate() + preset.days);
                  const picked = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
                  if (minDate && picked < minDate) return;
                  onChange(picked);
                  setIsOpen(false);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'var(--primary)';
                  (e.target as HTMLButtonElement).style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.target as HTMLButtonElement).style.color = 'var(--text-muted)';
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
