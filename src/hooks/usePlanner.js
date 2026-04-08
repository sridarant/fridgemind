import { useState } from 'react';

export default function usePlanner() {
  const [plan, setPlan] = useState([]);

  const addToPlan = (meal) => {
    setPlan(prev => [...prev, meal]);
  };

  const groupByDay = () => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return plan.reduce((acc, meal, i) => {
      const day = days[i % 7];
      acc[day] = acc[day] || [];
      acc[day].push(meal);
      return acc;
    }, {});
  };

  return { plan, addToPlan, groupByDay };
}
