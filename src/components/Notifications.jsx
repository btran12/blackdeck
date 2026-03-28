import React, { useContext } from 'react';
import { Box, Alert } from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';

export const Notifications = () => {
  const { notifications, removeNotification } = useContext(WidgetContext);

  return (
    <Box sx={{ position: 'fixed', bottom: 24, left: 24, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {notifications.map((notif) => (
        <Alert
          key={notif.id}
          severity={notif.type === 'success' ? 'success' : notif.type === 'error' ? 'error' : 'info'}
          onClose={() => removeNotification(notif.id)}
          sx={{
            bgcolor: notif.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : notif.type === 'error' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)',
            color: notif.type === 'success' ? '#4caf50' : notif.type === 'error' ? '#f44336' : '#2196f3',
            animation: 'fadeIn 0.3s ease-in',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
          }}
        >
          {notif.message}
        </Alert>
      ))}
    </Box>
  );
};
