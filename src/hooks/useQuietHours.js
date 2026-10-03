import { useContext, useEffect, useMemo, useState } from 'react';
import { WidgetContext } from '../context/WidgetContext';

const DEFAULT_START = '23:00';
const DEFAULT_END = '06:00';

const normalizeTime = (value, fallback) => {
  const input = String(value || '').trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input)) {
    return fallback;
  }
  return input;
};

const toMinutes = (timeValue) => {
  const [hours, minutes] = timeValue.split(':').map((part) => Number(part));
  return (hours * 60) + minutes;
};

export const isWithinQuietHours = (enabled, startTime, endTime, date = new Date()) => {
  if (!enabled) return false;

  const normalizedStart = normalizeTime(startTime, DEFAULT_START);
  const normalizedEnd = normalizeTime(endTime, DEFAULT_END);

  const startMinutes = toMinutes(normalizedStart);
  const endMinutes = toMinutes(normalizedEnd);
  const nowMinutes = (date.getHours() * 60) + date.getMinutes();

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

export const useQuietHours = () => {
  const { settings } = useContext(WidgetContext);
  const [now, setNow] = useState(() => new Date());

  const quietHoursEnabled = Boolean(settings?.quietHoursEnabled);
  const quietHoursStart = normalizeTime(settings?.quietHoursStart, DEFAULT_START);
  const quietHoursEnd = normalizeTime(settings?.quietHoursEnd, DEFAULT_END);

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timerId);
  }, []);

  const isQuietHours = useMemo(
    () => isWithinQuietHours(quietHoursEnabled, quietHoursStart, quietHoursEnd, now),
    [quietHoursEnabled, quietHoursStart, quietHoursEnd, now]
  );

  return {
    isQuietHours,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
  };
};
