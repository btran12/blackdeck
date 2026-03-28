import React, { useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Stack,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';

const WIDGET_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'clock', label: 'Clock' },
  { value: 'weather', label: 'Weather' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'news', label: 'News' },
];

const GRID_LAYOUT = [
  { row: 1, cols: '3-6-3', positions: [0, 1, 2] },
  { row: 2, cols: '3-6-3', positions: [3, 4, 5] },
  { row: 3, cols: '3-6-3', positions: [6, 7, 8] },
];

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, updateSettings, layout, updateLayout, fadeSettings, updateFadeSettings } = useContext(WidgetContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localFadeSettings, setLocalFadeSettings] = useState(fadeSettings || { clock: true, weather: true, calendar: true, news: true });

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleLayoutChange = (position, widget) => {
    const newLayout = [...localLayout];
    newLayout[position] = widget;
    setLocalLayout(newLayout);
  };

  const handleFadeToggle = (widgetType) => {
    setLocalFadeSettings(prev => ({
      ...prev,
      [widgetType]: !prev[widgetType]
    }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    updateLayout(localLayout);
    updateFadeSettings(localFadeSettings);
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          backgroundImage: 'none',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', pb: 2 }}>
        Settings
      </DialogTitle>

      <DialogContent sx={{ pt: 2, overflowY: 'auto' }}>
        <Stack spacing={4}>
          {/* API Keys Section */}
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>API Keys</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="OpenWeather API Key"
                type="password"
                value={localSettings.openweatherApiKey}
                onChange={(e) => handleSettingChange('openweatherApiKey', e.target.value)}
                placeholder="Enter your API key"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: '#444444' },
                    '&:hover fieldset': { borderColor: '#555555' },
                    '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                  '& .MuiInputLabel-root': { color: '#cccccc' },
                }}
              />

              <TextField
                fullWidth
                label="NewsAPI API Key"
                type="password"
                value={localSettings.newsApiKey}
                onChange={(e) => handleSettingChange('newsApiKey', e.target.value)}
                placeholder="Enter your API key"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: '#444444' },
                    '&:hover fieldset': { borderColor: '#555555' },
                    '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                  '& .MuiInputLabel-root': { color: '#cccccc' },
                }}
              />
            </Stack>
          </Box>

          {/* Weather Settings Section */}
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Weather Settings</Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Location"
                type="text"
                value={localSettings.location}
                onChange={(e) => handleSettingChange('location', e.target.value)}
                placeholder="Enter city name"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': { borderColor: '#444444' },
                    '&:hover fieldset': { borderColor: '#555555' },
                    '&.Mui-focused fieldset': { borderColor: '#2196f3' }
                  },
                  '& .MuiInputBase-input::placeholder': { color: '#888888', opacity: 1 },
                  '& .MuiInputLabel-root': { color: '#cccccc' },
                }}
              />

              <FormControl sx={{ minWidth: '150px' }} variant="outlined">
                <InputLabel sx={{ color: '#cccccc' }}>Temperature Unit</InputLabel>
                <Select
                  value={localSettings.tempUnit}
                  onChange={(e) => handleSettingChange('tempUnit', e.target.value)}
                  label="Temperature Unit"
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' }
                  }}
                >
                  <MenuItem value="C">Celsius</MenuItem>
                  <MenuItem value="F">Fahrenheit</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Clock Settings Section */}
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Clock Settings</Typography>
            <Stack spacing={2}>
              <FormControl sx={{ minWidth: '150px' }} variant="outlined">
                <InputLabel sx={{ color: '#cccccc' }}>Time Format</InputLabel>
                <Select
                  value={localSettings.clockFormat}
                  onChange={(e) => handleSettingChange('clockFormat', e.target.value)}
                  label="Time Format"
                  sx={{
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                    '& .MuiSvgIcon-root': { color: '#ffffff' }
                  }}
                >
                  <MenuItem value="12h">12-Hour Format</MenuItem>
                  <MenuItem value="24h">24-Hour Format</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Layout Settings Section */}
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>Dashboard Layout (3-6-3 Grid)</Typography>
            <Stack spacing={3}>
              {GRID_LAYOUT.map((row) => (
                <Box key={row.row}>
                  <Typography sx={{ color: '#aaaaaa', fontSize: '0.875rem', mb: 1 }}>Row {row.row}</Typography>
                  <Grid container spacing={2}>
                    {row.positions.map((position, index) => {
                      const colWidth = [3, 6, 3];
                      return (
                        <Grid item xs={12} md={colWidth[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>Column {index + 1}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={`Column ${index + 1}`}
                              sx={{
                                color: '#ffffff',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
                                '& .MuiSvgIcon-root': { color: '#ffffff' }
                              }}
                            >
                              {WIDGET_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value || ''}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Widget Fade Effects Section */}
          {localFadeSettings && (
            <Box>
              <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Widget Fade Effects</Typography>
              <Stack spacing={1}>
                {Object.keys(localFadeSettings).map((widget) => (
                  <FormControlLabel
                    key={widget}
                    control={
                      <Switch
                        checked={localFadeSettings[widget]}
                        onChange={() => handleFadeToggle(widget)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#2196f3',
                            '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.08)' }
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            bgcolor: 'rgba(33, 150, 243, 0.3)'
                          },
                          '& .MuiSwitch-track': {
                            bgcolor: '#444444'
                          }
                        }}
                      />
                    }
                    label={widget.charAt(0).toUpperCase() + widget.slice(1) + ' Fade'}
                    sx={{ color: '#ffffff' }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#ffffff',
            borderColor: '#444444',
            '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            bgcolor: '#2196f3',
            color: '#ffffff',
            '&:hover': { bgcolor: '#1976d2' }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
