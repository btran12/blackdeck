import React from 'react';
import { Box } from '@mui/material';

export const Widget = ({ title, children, className = '' }) => {
  return (
    <Box>
      <Box sx={{ color: '#ffffff' }} margin={2}>
        {children}
      </Box>
    </Box>
  );
};
