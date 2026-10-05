import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import ICAL from 'ical.js';
import { Widget } from '../Widget';
import { getServiceEndpoint } from '../../config/endpoints';
import { useQuietHours } from '../../hooks/useQuietHours';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const CALENDAR_PROXY_PATH = '/v1/services/calendar-ics';
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const normalizeIcsUrl = (value) => String(value || '').trim();

const truncateText = (value, max = 120) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
};

const getSourceLabel = (source, index) => {
  try {
    const parsed = new URL(source);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return `Source ${index + 1}`;
  }
};

const formatFetchError = (error, contextLabel) => {
  const message = String(error?.message || 'Failed to load feed');
  return `${contextLabel}: ${truncateText(message)}`;
};

const createTimeoutSignal = (timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request timed out'));
  }, timeoutMs);
  return { signal: controller.signal, timeoutId };
};

const fetchCalendarResponseText = async (url, timeoutMs = 20000) => {
  const { signal, timeoutId } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The read operation timed out');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchIcsTextWithFallback = async (source, calendarProxyEndpoint) => {
  const attempts = [];

  if (calendarProxyEndpoint) {
    attempts.push({
      mode: 'proxy',
      url: `${calendarProxyEndpoint}?${new URLSearchParams({ url: source }).toString()}`,
      timeoutMs: 25000,
    });
  }

  attempts.push({
    mode: 'direct',
    url: source,
    timeoutMs: 20000,
  });

  const attemptErrors = [];

  for (const attempt of attempts) {
    try {
      return await fetchCalendarResponseText(attempt.url, attempt.timeoutMs);
    } catch (error) {
      attemptErrors.push(formatFetchError(error, attempt.mode === 'proxy' ? 'proxy fetch failed' : 'direct fetch failed'));
    }
  }

  throw new Error(attemptErrors.join(' | '));
};

const buildCalendarSources = ({ icsUrl, icsUrls = [], mergeFeeds = false }) => {
  const single = normalizeIcsUrl(icsUrl);
  const selected = Array.isArray(icsUrls)
    ? icsUrls.map(normalizeIcsUrl).filter(Boolean)
    : [];

  if (mergeFeeds) {
    return Array.from(new Set([single, ...selected].filter(Boolean)));
  }

  if (!single) return [];
  return [single];
};

const atStartOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const atStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const safeJsDate = (icalTime) => {
  if (!icalTime || typeof icalTime.toJSDate !== 'function') return null;
  const value = icalTime.toJSDate();
  return Number.isNaN(value?.getTime?.()) ? null : value;
};

const buildEvent = (event, startTime, endTime, suffix = '', sourceId = 'default') => {
  const start = safeJsDate(startTime);
  if (!start) return null;

  const isAllDay = Boolean(startTime?.isDate);
  const resolvedEnd = safeJsDate(endTime)
    || (isAllDay ? addDays(start, 1) : start);

  return {
    id: `${sourceId}:${event.uid || event.summary || 'event'}:${suffix || start.toISOString()}`,
    summary: event.summary || 'Untitled event',
    start,
    end: resolvedEnd,
    isAllDay,
  };
};

const parseIcs = (text, sourceId = 'default') => {
  let component;
  try {
    component = new ICAL.Component(ICAL.parse(text));
  } catch {
    return [];
  }

  const todayStart = atStartOfDay(new Date());
  const rangeStart = ICAL.Time.fromJSDate(addDays(todayStart, -1), false);
  const rangeEnd = ICAL.Time.fromJSDate(addDays(todayStart, 18), false);

  const records = [];
  const seen = new Set();
  const vevents = component.getAllSubcomponents('vevent') || [];

  vevents.forEach((vevent) => {
    const event = new ICAL.Event(vevent);

    if (!event.startDate) return;

    if (event.isRecurring()) {
      const iterator = event.iterator(event.startDate.clone());
      let occurrence = iterator.next();
      let guard = 0;

      while (occurrence && guard < 1500) {
        guard += 1;
        if (occurrence.compare(rangeStart) < 0) {
          occurrence = iterator.next();
          continue;
        }
        if (occurrence.compare(rangeEnd) > 0) break;

        const details = event.getOccurrenceDetails(occurrence);
        const parsed = buildEvent(event, details.startDate, details.endDate, occurrence.toString(), sourceId);
        if (parsed) {
          const dedupeKey = `${parsed.id}:${parsed.start.toISOString()}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            records.push(parsed);
          }
        }

        occurrence = iterator.next();
      }

      return;
    }

    const parsed = buildEvent(event, event.startDate, event.endDate, '', sourceId);
    if (parsed) {
      const dedupeKey = `${parsed.id}:${parsed.start.toISOString()}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        records.push(parsed);
      }
    }
  });

  return records.sort((a, b) => a.start - b.start);
};

const buildMonthGrid = (viewMonth) => {
  const firstOfMonth = atStartOfMonth(viewMonth);
  const firstWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({
      key: `empty-start-${i}`,
      isEmpty: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    cells.push({
      date,
      key: toDateKey(date),
      isToday: toDateKey(date) === todayKey,
      isEmpty: false,
    });
  }

  return cells;
};

const mapEventsByDate = (events) => {
  const mapped = {};

  events.forEach((event) => {
    const start = atStartOfDay(event.start);
    const rawEnd = event.end ? atStartOfDay(event.end) : start;
    const endInclusive = event.isAllDay
      ? addDays(rawEnd, -1)
      : rawEnd;
    const spanEnd = endInclusive < start ? start : endInclusive;

    for (let day = new Date(start); day <= spanEnd; day = addDays(day, 1)) {
      const dayKey = toDateKey(day);
      if (!mapped[dayKey]) mapped[dayKey] = [];
      mapped[dayKey].push(event);
    }
  });

  Object.values(mapped).forEach((items) => {
    items.sort((a, b) => a.start - b.start);
  });

  return mapped;
};

export const Calendar = ({
  icsUrl,
  icsUrls = [],
  mergeFeeds = false,
  pollIntervalMinutes = 30,
  showFade = false,
}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const normalizedPollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;
  const calendarProxyEndpoint = getServiceEndpoint(CALENDAR_PROXY_PATH);
  const { isQuietHours } = useQuietHours();
  const sources = useMemo(
    () => buildCalendarSources({ icsUrl, icsUrls, mergeFeeds }),
    [icsUrl, icsUrls, mergeFeeds]
  );

  const fetchEvents = useCallback(async () => {
    if (sources.length === 0) {
      setEvents([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const settled = await Promise.allSettled(
        sources.map(async (source) => {
          const text = await fetchIcsTextWithFallback(source, calendarProxyEndpoint);
          return parseIcs(text, source);
        })
      );

      const nextEvents = [];
      const failures = [];

      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          nextEvents.push(...result.value);
          return;
        }

        failures.push(`${getSourceLabel(sources[index], index)}: ${result.reason?.message || 'Failed to load'}`);
      });

      const deduped = [];
      const seen = new Set();
      nextEvents
        .sort((a, b) => a.start - b.start)
        .forEach((event) => {
          const dedupeKey = `${event.summary}|${event.start.toISOString()}|${event.end.toISOString()}`;
          if (seen.has(dedupeKey)) return;
          seen.add(dedupeKey);
          deduped.push(event);
        });

      setEvents(deduped);

      if (failures.length > 0 && deduped.length > 0) {
        setError(`${failures[0]} (showing loaded events from other feeds)`);
      } else if (failures.length > 0) {
        throw new Error(failures[0]);
      }
    } catch (e) {
      if (e instanceof TypeError) {
        setError('Unable to fetch calendar events. Check URL accessibility and try again.');
      } else {
        setError(e.message || 'Failed to load calendar events.');
      }
    } finally {
      setLoading(false);
    }
  }, [sources, calendarProxyEndpoint]);

  useEffect(() => {
    if (isQuietHours) {
      setLoading(false);
      return undefined;
    }

    fetchEvents();
    const id = setInterval(fetchEvents, normalizedPollIntervalMs);
    return () => clearInterval(id);
  }, [fetchEvents, normalizedPollIntervalMs, isQuietHours]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNowMs(Date.now());
    }, 60 * 1000);

    return () => clearInterval(tick);
  }, []);

  const viewMonth = useMemo(() => atStartOfMonth(new Date(nowMs)), [nowMs]);

  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const eventsByDate = useMemo(() => mapEventsByDate(events), [events]);

  const sidebarEvents = useMemo(() => {
    const now = new Date(nowMs);
    const todayStart = atStartOfDay(now);

    return events
      .filter((event) => {
        const eventStartDay = atStartOfDay(event.start);
        return eventStartDay.getTime() === todayStart.getTime() && event.end.getTime() >= nowMs;
      })
      .sort((a, b) => a.start - b.start)
      .slice(0, 20);
  }, [events, nowMs]);

  const formatTimeValue = (date) => {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return '--:--';

    return value.toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatEventTime = (event) => {
    if (event.isAllDay) return 'All day';

    return formatTimeValue(event.start);
  };

  return (
    <Widget title="Calendar" widgetType="calendar" showFade={showFade} onRefresh={fetchEvents}>
      {sources.length === 0 ? (
        <Typography sx={{ fontSize: '0.75rem', color: '#666666', textAlign: 'center' }}>
          Add at least one calendar ICS URL in settings to show events
        </Typography>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <CircularProgress size={18} sx={{ color: '#90caf9' }} />
        </Box>
      ) : error ? (
        <Typography sx={{ fontSize: '0.7rem', color: '#f44336', textAlign: 'center' }}>
          {error}
        </Typography>
      ) : (
        <Stack spacing={1.5} sx={{ height: '100%' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '0.95fr 1.25fr' },
              gap: 1.25,
              minHeight: 0,
              flex: 1,
            }}
          >
            <Box
              sx={{
                p: 0,
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.4, mb: 0.5 }}>
                {WEEKDAY_LABELS.map((label) => (
                  <Typography
                    key={label}
                    sx={{
                      textAlign: 'center',
                      fontSize: '0.62rem',
                      color: '#888888',
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.4 }}>
                {monthGrid.map((cell) => {
                  if (cell.isEmpty) {
                    return <Box key={cell.key} sx={{ minHeight: 24 }} />;
                  }

                  const dayEvents = eventsByDate[cell.key] || [];

                  return (
                    <Box
                      key={cell.key}
                      sx={{
                        minHeight: 24,
                        borderRadius: '7px',
                        px: 0.35,
                        py: 0.2,
                        bgcolor: cell.isToday ? 'rgba(255,255,255,0.08)' : 'transparent',
                        border: cell.isToday ? '1px solid rgba(144,202,249,0.7)' : '1px solid transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          color: '#e0e0e0',
                          fontWeight: cell.isToday ? 700 : 500,
                          lineHeight: 1,
                        }}
                      >
                        {cell.date.getDate()}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.22, minHeight: 6, mt: 0.2 }}>
                        {dayEvents.length > 0 && (
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              bgcolor: '#90caf9',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            <Box
              sx={{
                p: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: '#888888',
                  mb: 0.9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Today's Events
              </Typography>

              {sidebarEvents.length === 0 ? (
                <Typography sx={{ fontSize: '0.72rem', color: '#8a8a8a' }}>
                  No more events today
                </Typography>
              ) : (
                sidebarEvents.map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      py: 0.45,
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      '&:last-of-type': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        color: '#9aa4b2',
                        lineHeight: 1.25,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {formatEventTime(event)}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: '0.74rem',
                        color: '#f5f5f5',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                      }}
                    >
                      {event.summary}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Stack>
      )}
    </Widget>
  );
};