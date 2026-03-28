import React, { useState, useEffect, useContext } from 'react';
import { Box, Button } from '@mui/material';
import { Widget } from '../Widget';
import { WidgetContext } from '../../context/WidgetContext';

export const Clock = () => {
  const { settings } = useContext(WidgetContext);
  const [time, setTime] = useState(new Date());
  const [format24, setFormat24] = useState(settings.clockFormat === '24h');

  useEffect(() => {
    setFormat24(settings.clockFormat === '24h');
  }, [settings.clockFormat]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = format24
    ? time.getHours().toString().padStart(2, '0')
    : (time.getHours() % 12 || 12).toString().padStart(2, '0');
  
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = format24 ? '' : (time.getHours() >= 12 ? 'PM' : 'AM');

  return (
    <Widget>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ fontSize: '3.75rem', fontWeight: 'light', fontFamily: 'monospace', mb: 2 }}>
          {hours}:{minutes}:{seconds}
        </Box>
        {!format24 && <Box sx={{ fontSize: '1.5rem', color: '#888888' }}>{ampm}</Box>}
      </Box>
    </Widget>
  );
};
