import { useState } from 'react';

export default function usePremium(){
  const [isPremium,setIsPremium]=useState(false);

  const canAccess=(feature)=>{
    if(isPremium) return true;
    const locked=['weekly_plan','kids_lunchbox'];
    return !locked.includes(feature);
  };

  return {isPremium,setIsPremium,canAccess};
}
