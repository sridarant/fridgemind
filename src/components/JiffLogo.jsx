// src/components/JiffLogo.jsx — v1.23.00
// Pure text wordmark. No SVG icon. No image.
//
// Style: lowercase "jiff", Fraunces Black 900, letter-spacing -0.03em
// Accent: first "j" is orange (#FF4500), rest is ink (#1C0A00)
// Motion: none (per spec — no animation on wordmark)
// Works at all sizes — sm/md/lg scale the font proportionally

export default function JiffLogo({
  size    = 'md',
  onClick,
  style   = {},
  dark    = false,   // if true, non-j letters render white (dark bg)
}) {
  const sizeMap = { sm: 18, md: 24, lg: 36 };
  const fs      = sizeMap[size] || sizeMap.md;
  const textCol = dark ? '#FFFAF5' : '#1C0A00';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        cursor:         onClick ? 'pointer' : 'default',
        userSelect:     'none',
        textDecoration: 'none',
        ...style,
      }}
    >
      <span style={{
        fontFamily:    "'Fraunces', serif",
        fontWeight:    900,
        fontSize:      fs,
        letterSpacing: '-0.03em',
        lineHeight:    1,
        color:         textCol,
      }}>
        <span style={{ color: '#FF4500' }}>{'j'}</span>{'iff'}
      </span>
    </div>
  );
}
