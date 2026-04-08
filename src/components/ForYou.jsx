import React from 'react';

export default function ForYou({ user = {}, timeOfDay = 'evening' }) {
  const name = user?.name || '';
  const timeLabelMap = {
    morning: 'this morning',
    afternoon: 'this afternoon',
    evening: 'this evening'
  };

  const baseText = name
    ? `For you, ${name}`
    : `For you ${timeLabelMap[timeOfDay] || 'today'}`;

  return (
    <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 12 }}>
      <h3>{baseText}</h3>
    </div>
  );
}
