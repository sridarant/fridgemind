import React from 'react';

export default function CookOrOrder() {
  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
      <h4>Don’t feel like cooking?</h4>
      <button onClick={() => window.open('https://www.zomato.com', '_blank')}>
        Order on Zomato
      </button>
      <button onClick={() => window.open('https://www.swiggy.com', '_blank')}>
        Order on Swiggy
      </button>
    </div>
  );
}
