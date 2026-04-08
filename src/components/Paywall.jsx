
import React from 'react';

export default function Paywall({ onUpgrade }) {
  return (
    <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 12 }}>
      <h3>Unlock Premium 🍽️</h3>
      <p>Get full meal plans, kids lunchbox & more</p>
      <button onClick={onUpgrade}>Upgrade Now</button>
    </div>
  );
}
