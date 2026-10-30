import { useEffect, useState } from 'react';
import { nowMinutes } from './time';

/** Minutes since midnight, refreshed once a minute. */
export function useNowMinutes(): number {
  const [now, setNow] = useState(nowMinutes());
  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
