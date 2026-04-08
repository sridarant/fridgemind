import { useState, useCallback } from 'react';
import { fetchMealSuggestions, rankMeals } from '../services/mealService';

export default function useMealEngine() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateMeals = useCallback(async (input = {}, preferences = {}) => {
    setLoading(true);
    let meals = await fetchMealSuggestions(input);
    meals = rankMeals(meals, preferences);
    setResults(meals);
    setLoading(false);
  }, []);

  return { results, generateMeals, loading };
}
