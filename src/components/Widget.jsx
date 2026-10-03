import React from 'react';
import { Box, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import { useQuietHours } from '../hooks/useQuietHours';

export const Widget = ({ widgetType, children, showFade = false, onRefresh, refreshLabel = 'Refresh' }) => {
  const { isQuietHours, quietHoursEnabled } = useQuietHours();
  const showQuietHoursBadge = quietHoursEnabled && isQuietHours && typeof onRefresh === 'function';

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        '& .widget-refresh-button': {
          opacity: 0,
          pointerEvents: 'none',
          transform: 'translateY(-2px)',
          transition: 'opacity 160ms ease, transform 160ms ease',
        },
        '&:hover .widget-refresh-button, &:focus-within .widget-refresh-button': {
          opacity: 1,
          pointerEvents: 'auto',
          transform: 'translateY(0)',
        },
      }}
    >
      {typeof onRefresh === 'function' && (
        <IconButton
          size="small"
          aria-label={refreshLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRefresh();
          }}
          className="widget-refresh-button"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 3,
            color: '#d0d0d0',
            bgcolor: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.15)',
            '&:hover': {
              bgcolor: 'rgba(33,150,243,0.22)',
              color: '#ffffff',
            },
          }}
        >
          <RefreshIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
      {showQuietHoursBadge && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 46,
            zIndex: 3,
            px: 1,
            py: 0.4,
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.55,
            color: '#d7e6ff',
            bgcolor: 'rgba(15, 28, 48, 0.72)',
            border: '1px solid rgba(138, 180, 248, 0.45)',
            fontSize: '0.62rem',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          <BedtimeOutlinedIcon sx={{ fontSize: 12 }} />
          Quiet Hours
        </Box>
      )}
      <Box sx={{ color: '#ffffff', padding: 2, height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {children}
      </Box>
      {/* Fade overlay at bottom - configurable per widget */}
      {showFade && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.9) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
};
