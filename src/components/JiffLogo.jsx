// src/components/JiffLogo.jsx
// Jiff brand mark — refined Spark Spoon icon + wordmark.
//
// Icon anatomy (viewBox 0 0 100 100):
//   Bowl:   oval cx=50 cy=27 rx=15 ry=10.5 (ratio 1.43:1 — reads oval not circle)
//   Neck:   bezier taper y=37.5→42, width 12px→3.5px
//   Handle: straight 3.5px wide, y=42→69 (~57% of stem — spoon dominant zone)
//   Bolt:   2-angle only — step left at y=69, diagonal to tip (54,85). Clean triangle.
//   Form:   single continuous closed path, white on #FF4500 square rx=22

const ICON_PATH = `
  M50 16
  C42 16 35 21 35 27
  C35 33 42 37.5 48.25 37.5
  C47 38.2 46.5 39.5 46.25 40.8
  C46 42 46 42 46 42
  L46 69
  L41.25 69
  L54 85
  L55 85
  L53 78
  L54.5 78
  L50 69
  L53.75 69
  L53.75 42
  C53.75 42 53.75 41 53.5 40.8
  C53.25 39.5 52.75 38.2 51.75 37.5
  C58 37.5 65 33 65 27
  C65 21 58 16 50 16 Z
`.trim();

const STYLES = `
  @keyframes jiff-reveal {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes jiff-pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.04); }
  }
  .jiff-logo-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
    text-decoration: none;
  }
  .jiff-icon-sq {
    flex-shrink: 0;
    display: block;
    border-radius: 22%;
    overflow: hidden;
  }
  .jiff-icon-sq.spinning svg {
    animation: jiff-pulse 1.8s ease-in-out infinite;
  }
  .jiff-wordmark {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    letter-spacing: -0.5px;
    line-height: 1;
    color: #1C0A00;
  }
  .jiff-wordmark .jiff-j { color: #FF4500; }
`;

export default function JiffLogo({
  size    = 'md',
  spinning = false,
  showText = true,
  onClick,
  style   = {},
}) {
  const S = { sm: 28, md: 36, lg: 52 };
  const sz = S[size] || S.md;
  const fontSize = sz * 0.62;

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="jiff-logo-wrap"
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        style={style}
      >
        <div className={'jiff-icon-sq' + (spinning ? ' spinning' : '')} style={{ width: sz, height: sz }}>
          <svg
            width={sz}
            height={sz}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Jiff"
          >
            <rect width="100" height="100" rx="22" fill="#FF4500"/>
            <path d={ICON_PATH} fill="white"/>
          </svg>
        </div>
        {showText && (
          <span className="jiff-wordmark" style={{ fontSize }}>
            <span className="jiff-j">j</span>iff
          </span>
        )}
      </div>
    </>
  );
}
