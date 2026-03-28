import React, { useContext } from 'react';
import { Box } from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';

export const Widget = ({ title, widgetType, children, className = '' }) => {
  const { fadeSettings } = useContext(WidgetContext);
  const showFade = widgetType && fadeSettings && fadeSettings[widgetType];

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ color: '#ffffff', margin: 2}}>
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
