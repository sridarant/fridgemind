// src/components/jiff/JiffLoader.jsx
// Splash/loading screen: centered icon with scale + fade + pulse animation.
// Duration: ~800ms reveal then gentle pulse loop.
// Used on route load, lazy-import suspense, and initial app load.

const LOADER_ICON_PATH = `
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

const LOADER_STYLES = `
  @keyframes jiff-loader-in {
    0%   { opacity: 0; transform: scale(0.78); }
    60%  { opacity: 1; transform: scale(1.04); }
    80%  { transform: scale(0.98); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes jiff-loader-pulse {
    0%,100% { transform: scale(1);    opacity: 1; }
    50%      { transform: scale(1.05); opacity: 0.88; }
  }
  .jiff-loader-root {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #FFFAF5;
    z-index: 9999;
  }
  .jiff-loader-icon {
    animation: jiff-loader-in 0.8s cubic-bezier(0.2,0,0.2,1) forwards,
               jiff-loader-pulse 2s ease-in-out 0.8s infinite;
    will-change: transform, opacity;
    opacity: 0;
  }
  .jiff-loader-wordmark {
    font-family: 'Fraunces', serif;
    font-weight: 900;
    font-size: 28px;
    letter-spacing: -0.5px;
    color: #1C0A00;
    margin-top: 14px;
    opacity: 0;
    animation: jiff-loader-in 0.8s cubic-bezier(0.2,0,0.2,1) 0.15s forwards;
  }
  .jiff-loader-wordmark .jiff-j { color: #FF4500; }
`;

export default function JiffLoader({ size = 72 }) {
  return (
    <>
      <style>{LOADER_STYLES}</style>
      <div className="jiff-loader-root" role="status" aria-label="Loading Jiff">
        <div className="jiff-loader-icon">
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100" height="100" rx="22" fill="#FF4500"/>
            <path d={LOADER_ICON_PATH} fill="white"/>
          </svg>
        </div>
        <div className="jiff-loader-wordmark">
          <span className="jiff-j">j</span>iff
        </div>
      </div>
    </>
  );
}
