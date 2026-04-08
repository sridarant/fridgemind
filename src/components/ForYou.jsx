import React from 'react';
export default function ForYou({ user = {}, timeOfDay = 'evening' }) {
  const name = user?.name || '';
  const label = name ? `For you, ${name}` : 'For you today';
  return (
    <div style={{ marginBottom:16, padding:16, background:'#f5f5f5', borderRadius:12 }}>
      <h3>{label}</h3>
    </div>
  );
}
