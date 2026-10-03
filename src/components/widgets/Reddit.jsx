import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { Widget } from '../Widget';
import { useQuietHours } from '../../hooks/useQuietHours';
import { useBackendService } from '../../hooks/useBackendService';

const DEFAULT_SUBREDDITS = [];
const DEFAULT_TITLES_PER_SUBREDDIT = 5;
const DEFAULT_POLL_INTERVAL_MINUTES = 30;
const DEFAULT_ROTATION_INTERVAL_SECONDS = 15;
const MAX_TOTAL_TITLES = 100;

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const parseSubreddits = (value) => {
  if (!value || typeof value !== 'string') return DEFAULT_SUBREDDITS;

  const parsed = value
    .split(',')
    .map((item) => item.trim().replace(/^r\//i, '').replace(/\s+/g, ''))
    .filter(Boolean);

  if (parsed.length === 0) return DEFAULT_SUBREDDITS;

  return Array.from(new Set(parsed));
};

export const Reddit = ({
  subreddits = DEFAULT_SUBREDDITS.join(','),
  titlesPerSubreddit = DEFAULT_TITLES_PER_SUBREDDIT,
  pollIntervalMinutes = DEFAULT_POLL_INTERVAL_MINUTES,
  rotationIntervalSeconds = DEFAULT_ROTATION_INTERVAL_SECONDS,
  showFade = false,
  usePremium = false,
}) => {
  const [posts, setPosts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);
  const { isQuietHours } = useQuietHours();

  const normalizedSubreddits = useMemo(() => parseSubreddits(subreddits), [subreddits]);
  const normalizedTitlesPerSubreddit = clamp(Number(titlesPerSubreddit), 1, 25);
  const normalizedPollIntervalMs = clamp(Number(pollIntervalMinutes), 1, 1440) * 60 * 1000;
  const normalizedRotationIntervalMs = clamp(Number(rotationIntervalSeconds), 2, 300) * 1000;

  const backendService = useBackendService(
    '/v1/services/reddit',
    {
      subreddits: normalizedSubreddits.join(','),
      limit: normalizedTitlesPerSubreddit,
    },
    pollIntervalMinutes,
    usePremium
  );

  const normalizePostShape = useCallback((rawPost) => {
    if (!rawPost) return null;

    const id = rawPost.id || rawPost.name;
    const title = rawPost.title || rawPost.headline;
    if (!title) return null;

    const subredditName = rawPost.subreddit || rawPost.subreddit_name_prefixed?.replace(/^r\//i, '') || 'reddit';
    const published = rawPost.publishedAt || rawPost.published_at || rawPost.created_utc;

    return {
      id,
      title,
      permalink: rawPost.permalink,
      url: rawPost.url,
      subreddit: subredditName,
      source: rawPost.source || `Reddit - r/${subredditName}`,
      publishedAt: typeof published === 'number'
        ? new Date(published * 1000).toISOString()
        : (published || new Date().toISOString()),
    };
  }, []);

  const applyPosts = useCallback((rawPosts) => {
    const seen = new Set();
    const normalized = [];

    (Array.isArray(rawPosts) ? rawPosts : []).forEach((post) => {
      const mapped = normalizePostShape(post);
      if (!mapped) return;

      const key = mapped.id || mapped.permalink || `${mapped.title}-${mapped.publishedAt}`;
      if (seen.has(key)) return;
      seen.add(key);
      normalized.push(mapped);
    });

    if (normalized.length === 0) {
      setError('No Reddit posts found for the configured subreddits.');
      setPosts([]);
      return;
    }

    setPosts(normalized.slice(0, MAX_TOTAL_TITLES));
    setCurrentIndex(0);
    setError(null);
  }, [normalizePostShape]);

  const fetchRedditJsonWithFallback = useCallback(async (subreddit) => {
    const encodedSubreddit = encodeURIComponent(subreddit);
    const directCandidates = [
      `https://www.reddit.com/r/${encodedSubreddit}/top.json?t=day&limit=${normalizedTitlesPerSubreddit}&raw_json=1`,
      `https://api.reddit.com/r/${encodedSubreddit}/top?t=day&limit=${normalizedTitlesPerSubreddit}&raw_json=1`,
      `https://www.reddit.com/r/${encodedSubreddit}/new.json?limit=${normalizedTitlesPerSubreddit}&raw_json=1`,
      `https://old.reddit.com/r/${encodedSubreddit}/top.json?t=day&limit=${normalizedTitlesPerSubreddit}&raw_json=1`,
    ];

    const candidates = [
      ...directCandidates,
      ...directCandidates.map((url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`),
      ...directCandidates.map((url) => `https://cors.isomorphic-git.org/${url}`),
    ];

    let lastStatus = null;
    let lastErrorMessage = '';

    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 403) {
            const bodyText = await response.text().catch(() => '');
            if (bodyText.toLowerCase().includes('whoa there, pardner')) {
              throw new Error('Reddit blocked browser requests from this network. Use a signed-in premium account for backend proxy access.');
            }
          }

          lastStatus = response.status;
          continue;
        }

        const data = await response.json();
        return data;
      } catch (error) {
        lastErrorMessage = error?.message || 'Unknown request error';
        // Keep trying fallback endpoints.
      }
    }

    const statusSuffix = lastStatus ? ` (HTTP ${lastStatus})` : '';
    const detailSuffix = lastErrorMessage ? ` - ${lastErrorMessage}` : '';
    throw new Error(`Failed to fetch r/${subreddit}${statusSuffix}${detailSuffix}`);
  }, [normalizedTitlesPerSubreddit]);

  const fetchSubredditPosts = useCallback(async (subreddit) => {
    const data = await fetchRedditJsonWithFallback(subreddit);
    const children = Array.isArray(data?.data?.children) ? data.data.children : [];

    return children
      .map((item) => item?.data)
      .filter((item) => item?.title)
      .map((item) => ({
        id: item.id,
        title: item.title,
        permalink: item.permalink,
        url: item.url,
        subreddit: item.subreddit,
        source: `Reddit - r/${item.subreddit}`,
        publishedAt: new Date(item.created_utc * 1000).toISOString(),
      }));
  }, [fetchRedditJsonWithFallback]);

  const fetchReddit = useCallback(async () => {
    if (usePremium) {
      await backendService.refetch(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled(
        normalizedSubreddits.map((subreddit) => fetchSubredditPosts(subreddit))
      );

      const merged = [];
      const seen = new Set();

      results.forEach((result) => {
        if (result.status !== 'fulfilled') return;

        result.value.forEach((post) => {
          const key = post.id || post.permalink || `${post.title}-${post.publishedAt}`;
          if (!seen.has(key) && merged.length < MAX_TOTAL_TITLES) {
            seen.add(key);
            merged.push(post);
          }
        });
      });

      if (merged.length === 0) {
        setError('No Reddit posts found for the configured subreddits.');
        setPosts([]);
        return;
      }

      setPosts(merged);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message || 'Failed to fetch Reddit posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [usePremium, backendService, fetchSubredditPosts, normalizedSubreddits]);

  useEffect(() => {
    if (!usePremium) return;

    if (!backendService.loading && backendService.error) {
      setError(backendService.error);
      setLoading(false);
      return;
    }

    const payload = backendService.data;
    if (!payload) {
      setLoading(backendService.loading);
      return;
    }

    const postsFromPayload = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.posts)
        ? payload.posts
        : Array.isArray(payload.items)
          ? payload.items
          : [];

    applyPosts(postsFromPayload);
    setLoading(backendService.loading);
  }, [usePremium, backendService.data, backendService.loading, backendService.error, applyPosts]);

  useEffect(() => {
    if (usePremium) {
      setLoading(backendService.loading);
      return undefined;
    }

    if (isQuietHours) {
      setLoading(false);
      return undefined;
    }

    fetchReddit();
    const pollInterval = setInterval(fetchReddit, normalizedPollIntervalMs);

    return () => {
      clearInterval(pollInterval);
    };
  }, [usePremium, fetchReddit, normalizedPollIntervalMs, isQuietHours, backendService.loading]);

  useEffect(() => {
    if (posts.length === 0) return undefined;

    const rotationInterval = setInterval(() => {
      setIsFading(true);

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % posts.length);
        setIsFading(false);
      }, 500);
    }, normalizedRotationIntervalMs);

    return () => {
      clearInterval(rotationInterval);
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [normalizedRotationIntervalMs, posts.length]);

  const currentPost = posts[currentIndex];

  return (
    <Widget title="Reddit" widgetType="reddit" showFade={showFade} onRefresh={fetchReddit}>
      {loading && <Typography sx={{ color: '#888888' }}>Loading Reddit posts...</Typography>}

      {!loading && error && (
        <Typography sx={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</Typography>
      )}

      {!loading && !error && posts.length === 0 && (
        <Typography sx={{ color: '#888888' }}>No posts found</Typography>
      )}

      {!loading && !error && currentPost && (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              pb: 1,
              opacity: isFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            <Typography sx={{ fontSize: '0.95rem', color: '#666666' }}>
              {new Date(currentPost.publishedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: '#aaaaaa' }}>
              {currentPost.source}
            </Typography>
          </Box>

          <Typography
            sx={{
              fontSize: 'clamp(1.1rem, 1.5vw, 1.8rem)',
              color: '#ffffff',
              lineHeight: 1.3,
              fontFamily: 'var(--font-family, monospace)',
              textAlign: 'center',
              opacity: isFading ? 0 : 1,
              transition: 'opacity 0.5s ease-in-out',
            }}
          >
            {currentPost.title}
          </Typography>

          <Box sx={{ opacity: isFading ? 0 : 1, transition: 'opacity 0.5s ease-in-out', textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#888888' }}>
              {currentIndex + 1} of {posts.length}
            </Typography>
          </Box>
        </Box>
      )}
    </Widget>
  );
};
