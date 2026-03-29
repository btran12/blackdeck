import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Button,
  Box,
  Stack,
  Typography,
  Grid,
} from '@mui/material';
import { WidgetContext } from '../context/WidgetContext';
import { WidgetSettingsForm } from './WidgetSettingsForm';
import {
  createWidgetSettingsForType,
  getPositionLabel,
  GRID_LAYOUT,
  WIDGET_LABELS,
  WIDGET_OPTIONS,
} from './widgetConfig';

const selectStyles = {
  color: '#ffffff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444444' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#555555' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2196f3' },
  '& .MuiSvgIcon-root': { color: '#ffffff' },
};

const buildSettingsDefaultsFromInstances = (layoutWidgets, widgetSettingsMap, previousSettings) => {
  const nextSettings = { ...previousSettings };

  layoutWidgets.forEach((widgetType, position) => {
    const instanceSettings = widgetSettingsMap[position];
    if (!widgetType || !instanceSettings) return;

    if (widgetType === 'clock' && instanceSettings.clockFormat) {
      nextSettings.clockFormat = instanceSettings.clockFormat;
    }

    if (widgetType === 'weather') {
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
      nextSettings.tempUnit = instanceSettings.tempUnit || nextSettings.tempUnit;
      nextSettings.clockFormat = instanceSettings.clockFormat || nextSettings.clockFormat;
    }

    if (widgetType === 'calendar' && instanceSettings.icsUrl) {
      nextSettings.icsUrl = instanceSettings.icsUrl;
    }

    if (widgetType === 'news' && instanceSettings.newsApiKey) {
      nextSettings.newsApiKey = instanceSettings.newsApiKey;
    }

    if (widgetType === 'stocks' && instanceSettings.finnhubApiKey) {
      nextSettings.finnhubApiKey = instanceSettings.finnhubApiKey;
    }

    if (widgetType === 'airquality') {
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }

    if (widgetType === 'compliments') {
      nextSettings.complimentsConfigUrl = instanceSettings.complimentsConfigUrl || nextSettings.complimentsConfigUrl;
      nextSettings.openweatherApiKey = instanceSettings.openweatherApiKey || nextSettings.openweatherApiKey;
      nextSettings.location = instanceSettings.location || nextSettings.location;
    }
  });

  return nextSettings;
};

export const SettingsPanel = ({ isOpen, onClose }) => {
  const { settings, layout, widgetSettings, saveDashboardConfiguration } = useContext(WidgetContext);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localLayout, setLocalLayout] = useState(layout.widgets);
  const [localWidgetSettings, setLocalWidgetSettings] = useState(widgetSettings);

  useEffect(() => {
    if (!isOpen) return;

    setLocalSettings(settings);
    setLocalLayout(layout.widgets);
    setLocalWidgetSettings(widgetSettings);
  }, [isOpen, layout.widgets, settings, widgetSettings]);

  const handleLayoutChange = (position, widgetType) => {
    const nextLayout = [...localLayout];
    nextLayout[position] = widgetType;
    setLocalLayout(nextLayout);

    setLocalWidgetSettings(prev => {
      const next = { ...prev };

      if (!widgetType) {
        delete next[position];
        return next;
      }

      if (next[position]?.widgetType === widgetType) {
        return next;
      }

      const existingInstance = Object.values(next).find(item => item?.widgetType === widgetType);
      next[position] = existingInstance
        ? { ...existingInstance, widgetType }
        : createWidgetSettingsForType(widgetType, localSettings);

      return next;
    });
  };

  const handleWidgetSettingChange = (position, key, value) => {
    setLocalWidgetSettings(prev => ({
      ...prev,
      [position]: {
        widgetType: prev[position]?.widgetType || localLayout[position],
        ...prev[position],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    const nextSettings = buildSettingsDefaultsFromInstances(localLayout, localWidgetSettings, localSettings);
    saveDashboardConfiguration(localLayout, localWidgetSettings, nextSettings);
    onClose();
  };

  const selectedWidgets = localLayout
    .map((widgetType, position) => {
      if (!widgetType) return null;

      return {
        position,
        widgetType,
        settings: localWidgetSettings[position] || createWidgetSettingsForType(widgetType, localSettings),
      };
    })
    .filter(Boolean);

  const renderWidgetFields = (widget) => {
    const position = widget.position;
    const currentSettings = localWidgetSettings[position] || widget.settings;

    return (
      <WidgetSettingsForm
        widgetType={widget.widgetType}
        settings={currentSettings}
        onChange={(key, value) => handleWidgetSettingChange(position, key, value)}
      />
    );
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
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', pb: 2 }}>
        Settings
      </DialogTitle>

      <DialogContent sx={{ pt: 2, overflowY: 'auto' }}>
        <Stack spacing={4}>
          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 3 }}>Dashboard Layout</Typography>
            <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
              {GRID_LAYOUT.map((row) => {
                const colWidths = row.cols === '12' ? [12] : [3, 6, 3];
                return (
                  <Box key={row.row}>
                    <Typography sx={{ color: '#ffffff', fontSize: '1rem', mb: 1 }}>
                      {row.cols === '12' ? 'Bottom Row' : row.row === 1 ? 'Top Row' : 'Middle Row'}
                    </Typography>
                    <Grid container spacing={2}>
                      {row.positions.map((position, index) => (
                        <Grid item xs={12} md={colWidths[index]} key={position}>
                          <FormControl sx={{ minWidth: '150px' }} size="small" variant="outlined">
                            <InputLabel sx={{ color: '#cccccc' }}>{getPositionLabel(position)}</InputLabel>
                            <Select
                              value={localLayout[position] || ''}
                              onChange={(e) => handleLayoutChange(position, e.target.value || null)}
                              label={getPositionLabel(position)}
                              sx={selectStyles}
                            >
                              {WIDGET_OPTIONS.map((option) => (
                                <MenuItem key={option.label} value={option.value || ''}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2 }}>Widget Settings</Typography>
            {selectedWidgets.length === 0 ? (
              <Typography sx={{ color: '#888888' }}>Select widgets in the layout above to configure their settings.</Typography>
            ) : (
              <Stack spacing={3} divider={<Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />}>
                {selectedWidgets.map((widget) => (
                  <Box key={`${widget.widgetType}-${widget.position}`}>
                    <Typography sx={{ color: '#ffffff', fontWeight: 'bold', mb: 2, fontSize: '1rem', textAlign: 'center' }}>
                      {WIDGET_LABELS[widget.widgetType]} · {getPositionLabel(widget.position)}
                    </Typography>
                    {renderWidgetFields(widget)}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#ffffff',
            borderColor: '#444444',
            '&:hover': { borderColor: '#555555', bgcolor: 'rgba(255,255,255,0.05)' },
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
            '&:hover': { bgcolor: '#1976d2' },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};