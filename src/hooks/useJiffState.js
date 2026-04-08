import { useState } from 'react';

export default function useJiffState() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);

  return { meals, setMeals, loading, setLoading };
}
