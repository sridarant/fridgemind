// src/components/JiffLogo.jsx
// Jiff brand mark — Plate + Spark concept.
//
// Icon: circle (plate) with a small lightning bolt overlaid at center.
// Reads instantly at 24px: circle = plate/food, bolt = fast/spark.
// Single viewBox 0 0 100 100, white shapes on #FF4500 square rx=22.

const STYLES = `
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
    -webkit-tap-highlight-color: transparent;
  }
  .jiff-icon-sq {
    flex-shrink: 0;
    display: block;
    border-radius: 22%;
    overflow: hidden;
  }
  .jiff-icon-sq.spinning svg {
    animation: jiff-pulse 1.6s ease-in-out infinite;
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

// Icon geometry (viewBox 0 0 100 100):
//
//  PLATE: circle cx=50 cy=52, r=30 (stroke 5.5, no fill)
//         sits in lower 60% of icon — plate seen from above
//
//  BOLT:  classic 2-step lightning bolt
//         upper-left to center: M44 20 L38 46 L50 46
//         center to lower-right: L50 46 L62 46 L56 72
//         stroke 7, round caps/joins, white
//         centered horizontally over plate

function PlateSparkIcon({ size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Jiff"
    >
      {/* Orange rounded-square background */}
      <rect width="100" height="100" rx="22" fill="#FF4500"/>

      {/* Plate — circle (stroke only, no fill so bolt shows through) */}
      <circle
        cx="50" cy="55"
        r="28"
        stroke="white"
        strokeWidth="5"
        fill="none"
        opacity="0.9"
      />

      {/* Spark / bolt — 2 direction changes, thick strokes */}
      <polyline
        points="55,20 44,48 54,48 45,80"
        stroke="white"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export default function JiffLogo({
  size     = 'md',
  spinning = false,
  showText = true,
  onClick,
  style    = {},
}) {
  const S  = { sm: 28, md: 36, lg: 52 };
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
        <div
          className={'jiff-icon-sq' + (spinning ? ' spinning' : '')}
          style={{ width: sz, height: sz }}
        >
          <PlateSparkIcon size={sz} />
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
