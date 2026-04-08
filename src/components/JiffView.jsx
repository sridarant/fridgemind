import React, { memo } from 'react';

function JiffView({ results, onGenerate }) {
  return (
    <div>
      <button onClick={() => onGenerate()}>Generate Meals</button>
      <ul>
        {results.map((r, i) => <li key={i}>{r.name}</li>)}
      </ul>
    </div>
  );
}

export default memo(JiffView);
