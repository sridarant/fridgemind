
import { useState } from 'react';

export default function usePremium() {
  const [isPremium, setIsPremium] = useState(false);

  const checkAccess = (feature) => {
    if (isPremium) return true;

    const lockedFeatures = ['weekly_plan', 'premium_recipes'];
    return !lockedFeatures.includes(feature);
  };

  return { isPremium, setIsPremium, checkAccess };
}
