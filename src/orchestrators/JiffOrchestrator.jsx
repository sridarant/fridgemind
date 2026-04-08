import React from 'react';
import useJiffState from '../hooks/useJiffState';
import useMealEngine from '../hooks/useMealEngine';
import usePlanner from '../hooks/usePlanner';
import JiffView from '../components/JiffView';

export default function JiffOrchestrator() {
  const { loading: baseLoading } = useJiffState();
  const { results, generateMeals, loading } = useMealEngine();
  const { plan } = usePlanner();

  return (
    <div>
      {(baseLoading || loading) && <p>Loading meals...</p>}
      <JiffView results={results} onGenerate={generateMeals} />
      <p>Planned: {plan.length}</p>
    </div>
  );
}
