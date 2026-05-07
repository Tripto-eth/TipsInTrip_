export default function Spinner({ size = 40 }: { size?: number }) {
  const r = size / 2;
  const stroke = Math.max(2, size / 16);
  const cr = r - stroke * 1.5;
  const circ = 2 * Math.PI * cr;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={r} cy={r} r={cr} fill="none" stroke="rgba(157,78,221,0.2)" strokeWidth={stroke} />
      <circle
        cx={r} cy={r} r={cr} fill="none"
        stroke="#9d4edd" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
        style={{ transformOrigin: '50% 50%', animation: 'spin 0.9s linear infinite' }}
      />
    </svg>
  );
}
