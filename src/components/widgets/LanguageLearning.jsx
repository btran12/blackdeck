import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Widget } from '../Widget';
import { DEFAULT_LANGUAGE_PACK, getLanguagePack } from './languagePacks';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const FADE_DURATION_MS = 320;

const shuffleArray = (items) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

export const LanguageLearning = ({
  languagePack = DEFAULT_LANGUAGE_PACK,
  batchSize = 5,
  randomize = true,
  rotationIntervalSeconds = 30,
  showFade = false,
}) => {
  const pack = useMemo(() => getLanguagePack(languagePack), [languagePack]);
  const entries = pack?.entries || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledEntries, setShuffledEntries] = useState(() => []);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);
  const safeBatchSize = batchSize === 10 ? 10 : 5;

  const intervalMs = clamp(Number(rotationIntervalSeconds) || 30, 5, 600) * 1000;

  useEffect(() => {
    setShuffledEntries(randomize ? shuffleArray(entries) : [...entries]);
    setCurrentIndex(0);
  }, [entries, languagePack, safeBatchSize, randomize]);

  useEffect(() => {
    if (entries.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setIsFading(true);

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + safeBatchSize;
          if (nextIndex >= entries.length) {
            if (randomize) {
              setShuffledEntries(shuffleArray(entries));
            }
            return 0;
          }
          return nextIndex;
        });
        setIsFading(false);
      }, FADE_DURATION_MS);
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [entries, entries.length, intervalMs, randomize, safeBatchSize]);

  const visibleEntries = useMemo(() => {
    if (shuffledEntries.length === 0) return [];

    return shuffledEntries.slice(currentIndex, currentIndex + safeBatchSize);
  }, [currentIndex, safeBatchSize, shuffledEntries]);

  return (
    <Widget widgetType="languagelearning" showFade={showFade}>
      <Stack
        spacing={safeBatchSize === 10 ? 1 : 1.4}
        sx={{
          height: '100%',
          justifyContent: safeBatchSize === 10 ? 'space-evenly' : 'space-around',
          alignItems: 'stretch',
          textAlign: 'center',
          px: 1.5,
          overflow: 'hidden',
          opacity: isFading ? 0 : 1,
          transition: `opacity ${FADE_DURATION_MS}ms ease`,
        }}
      >
        {visibleEntries.map((entry, index) => (
          <Box
            key={`${currentIndex}-${index}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.1,
              width: '100%',
            }}
          >
            <Typography
              sx={{
                color: '#b0b0b0',
                fontSize: safeBatchSize === 10 ? '1.08rem' : '1.3rem',
                lineHeight: 1.25,
                fontWeight: 600,
                flex: '1 1 45%',
                textAlign: 'right',
              }}
            >
              {entry.source}
            </Typography>
            <ArrowForwardIcon
              sx={{
                color: '#9a9a9a',
                fontSize: safeBatchSize === 10 ? 24 : 30,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                color: '#b0b0b0',
                fontSize: safeBatchSize === 10 ? '1.08rem' : '1.3rem',
                lineHeight: 1.25,
                fontWeight: 600,
                flex: '1 1 45%',
                textAlign: 'left',
              }}
            >
              {entry.target}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Widget>
  );
};
