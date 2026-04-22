'use client';

import { useState, useRef, useEffect } from 'react';

interface MiniRangePickerProps {
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  onChangeStart: (d: string) => void;
  onChangeEnd: (d: string) => void;
  className?: string;
  label?: string;
}

export default function MiniRangePicker({ startDate, endDate, onChangeStart, onChangeEnd, className, label }: MiniRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
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

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const dayNames = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
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
    
    if (selecting === 'start') {
      onChangeStart(clicked);
      if (endDate && clicked > endDate) {
        onChangeEnd('');
      }
      setSelecting('end');
    } else {
      if (clicked < startDate) {
        // Se clicchi prima dello start, resetta e ricomincia
        onChangeStart(clicked);
        onChangeEnd('');
        setSelecting('end');
      } else {
        onChangeEnd(clicked);
        setSelecting('start');
        setIsOpen(false);
      }
    }
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const d = toDateStr(viewMonth.year, viewMonth.month, day);
    return d > startDate && d < endDate;
  };

  const isStart = (day: number) => {
    return startDate === toDateStr(viewMonth.year, viewMonth.month, day);
  };

  const isEnd = (day: number) => {
    return endDate === toDateStr(viewMonth.year, viewMonth.month, day);
  };

  const isToday = (day: number) => {
    const now = new Date();
    return viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth() && day === now.getDate();
  };

  const isPast = (day: number) => {
    const d = new Date(viewMonth.year, viewMonth.month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    // Parsing esplicito per evitare shift di fuso (YYYY-MM-DD interpretato come UTC)
    const [y, m, dd] = dateStr.split('-').map(Number);
    const d = new Date(y, m - 1, dd);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month);
  const firstDay = getFirstDayOfMonth(viewMonth.year, viewMonth.month);

  return (
    <div style={{ position: 'relative', flex: 1 }} ref={wrapperRef}>
      {/* Trigger Button */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto' }}>
          {!startDate && !endDate ? (
            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
              {label === 'Andata' ? 'Seleziona date' : 'Date ritorno'}
            </span>
          ) : (
            <>
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                {formatDisplay(startDate)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>→</span>
              <span style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                {formatDisplay(endDate)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '0',
          right: 'auto',
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
          {/* Step Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: selecting === 'start' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              color: selecting === 'start' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }} onClick={() => setSelecting('start')}>
              Da: {formatDisplay(startDate)}
            </span>
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: selecting === 'end' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              color: selecting === 'end' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }} onClick={() => setSelecting('end')}>
              A: {formatDisplay(endDate)}
            </span>
          </div>

          {/* Month Navigation */}
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

          {/* Day Names Header */}
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

          {/* Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
          }}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const past = isPast(day);
              const start = isStart(day);
              const end = isEnd(day);
              const inRange = isInRange(day);
              const today = isToday(day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={past}
                  onClick={() => !past && handleDayClick(day)}
                  style={{
                    width: '34px',
                    height: '34px',
                    border: 'none',
                    borderRadius: start || end ? '50%' : inRange ? '4px' : '50%',
                    background: start || end
                      ? 'var(--primary)'
                      : inRange
                        ? 'rgba(139, 92, 246, 0.2)'
                        : 'transparent',
                    color: past
                      ? 'rgba(255,255,255,0.15)'
                      : start || end
                        ? '#fff'
                        : inRange
                          ? 'rgba(255,255,255,0.9)'
                          : '#fff',
                    cursor: past ? 'default' : 'pointer',
                    fontWeight: start || end || today ? 700 : 400,
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    outline: today && !start && !end ? '1px solid var(--primary)' : 'none',
                    margin: '0 auto',
                  }}
                  onMouseEnter={(e) => {
                    if (!past && !start && !end) {
                      (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!past && !start && !end) {
                      (e.target as HTMLButtonElement).style.background = inRange ? 'rgba(139, 92, 246, 0.2)' : 'transparent';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick presets */}
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
              { label: '+30gg', days: 30 },
              { label: '+60gg', days: 60 },
              { label: '+90gg', days: 90 },
            ].map(preset => (
              <button
                key={preset.days}
                type="button"
                onClick={() => {
                  const now = new Date();
                  const end = new Date();
                  end.setDate(now.getDate() + preset.days);
                  onChangeStart(toDateStr(now.getFullYear(), now.getMonth(), now.getDate()));
                  onChangeEnd(toDateStr(end.getFullYear(), end.getMonth(), end.getDate()));
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
