import { useEffect, useState } from 'react';
import { TimeOfDay } from '../types/game';

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Singapore',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Singapore sits near the equator: sunrise ~7:00 and sunset ~19:10 all year round.
const DAY_START = 7 * 60;
const DAY_END = 19 * 60;

export interface SingaporeClock {
  label: string; // "19:15"
  timeOfDay: TimeOfDay;
}

export function singaporeClock(now = new Date()): SingaporeClock {
  const label = formatter.format(now);
  const [h, m] = label.split(':').map(Number);
  const mins = h * 60 + m;
  return { label, timeOfDay: mins >= DAY_START && mins < DAY_END ? 'afternoon' : 'evening' };
}

/** Live Singapore time, re-checked every 15s (only re-renders when the minute changes). */
export function useSingaporeClock(): SingaporeClock {
  const [clock, setClock] = useState(singaporeClock);
  useEffect(() => {
    const id = setInterval(() => {
      const next = singaporeClock();
      setClock((prev) => (prev.label === next.label ? prev : next));
    }, 15000);
    return () => clearInterval(id);
  }, []);
  return clock;
}
