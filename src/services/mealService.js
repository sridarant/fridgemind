export function rankMeals(meals, preferences = {}) {
  return meals.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (preferences.quick && a.time < 30) scoreA += 2;
    if (preferences.quick && b.time < 30) scoreB += 2;

    if (preferences.veg && a.type === 'veg') scoreA += 1;
    if (preferences.veg && b.type === 'veg') scoreB += 1;

    return scoreB - scoreA;
  });
}

export async function fetchMealSuggestions(input) {
  try {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    const data = await res.json();
    return data.meals || [];
  } catch (e) {
    console.error('Meal API error', e);
    return [];
  }
}
