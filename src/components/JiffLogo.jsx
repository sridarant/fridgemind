// src/components/JiffLogo.jsx — animated Jiff logo with lightning bolt pulse

const LOGO_STYLES = `
  @keyframes jiff-bolt-pulse {
    0%   { transform: scale(1) translateY(0);   opacity: 1; }
    30%  { transform: scale(1.3) translateY(-2px); opacity: 0.9; }
    50%  { transform: scale(0.95) translateY(1px);  opacity: 1; }
    70%  { transform: scale(1.15) translateY(-1px); opacity: 0.95; }
    100% { transform: scale(1) translateY(0);   opacity: 1; }
  }
  @keyframes jiff-text-glow {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.85; }
  }
  @keyframes jiff-ring-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .jiff-logo-wrap {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
  }
  .jiff-bolt-ring {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .jiff-ring-svg {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    transform-origin: center;
  }
  .jiff-ring-svg.spinning {
    animation: jiff-ring-spin 2s linear infinite;
  }
  .jiff-bolt {
    position: relative;
    z-index: 1;
    animation: jiff-bolt-pulse 2.4s ease-in-out infinite;
    animation-delay: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  .jiff-bolt:hover {
    animation-duration: 0.6s;
  }
  .jiff-logo-name {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    letter-spacing: -0.5px;
    line-height: 1;
  }
  .jiff-logo-name .j {
    color: #FF4500;
    font-style: italic;
  }
`;

export default function JiffLogo({
  size = 'md',       // 'sm' | 'md' | 'lg'
  spinning = false,  // show spinning ring around bolt
  onClick,
  style = {},
}) {
  const sizes = {
    sm: { bolt: 16, font: 16, ring: 24, ringStroke: 1.5 },
    md: { bolt: 22, font: 22, ring: 32, ringStroke: 1.5 },
    lg: { bolt: 36, font: 36, ring: 52, ringStroke: 2 },
  };
  const sz = sizes[size] || sizes.md;
  const r = (sz.ring / 2) - sz.ringStroke;
  const circ = 2 * Math.PI * r;

  return (
    <>
      <style>{LOGO_STYLES}</style>
      <div className="jiff-logo-wrap" onClick={onClick} style={style}>
        <div className="jiff-bolt-ring" style={{ width: sz.ring, height: sz.ring }}>
          {spinning && (
            <svg className={'jiff-ring-svg' + (spinning ? ' spinning' : '')}
              viewBox={`0 0 ${sz.ring} ${sz.ring}`} xmlns="http://www.w3.org/2000/svg">
              <circle
                cx={sz.ring / 2} cy={sz.ring / 2} r={r}
                fill="none"
                stroke="#FF4500"
                strokeWidth={sz.ringStroke}
                strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
          )}
          <div className="jiff-bolt" style={{ fontSize: sz.bolt }}>⚡</div>
        </div>
        <span className="jiff-logo-name" style={{ fontSize: sz.font, color: '#1C0A00' }}>
          <span className="j">J</span>iff
        </span>
      </div>
    </>
  );
}
