import React, { createContext, useState, useCallback } from 'react';

export const WidgetContext = createContext();

export const WidgetProvider = ({ children }) => {
  const [widgets, setWidgets] = useState([
    { id: 1, type: 'clock', title: 'Clock', size: 'medium' },
    { id: 2, type: 'weather', title: 'Weather', size: 'large' },
    { id: 3, type: 'calendar', title: 'Calendar', size: 'medium' },
    { id: 4, type: 'news', title: 'News', size: 'large' },
  ]);

  const [settings, setSettings] = useState({
    openweatherApiKey: localStorage.getItem('openweatherApiKey') || '',
    newsApiKey: localStorage.getItem('newsApiKey') || '',
    location: localStorage.getItem('location') || 'New York',
    tempUnit: localStorage.getItem('tempUnit') || 'C',
    clockFormat: localStorage.getItem('clockFormat') || '24h',
  });

  const [fadeSettings, setFadeSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('fadeSettings');
      return stored ? JSON.parse(stored) : { clock: true, weather: true, calendar: true, news: true };
    } catch (e) {
      console.error('Error parsing fadeSettings from localStorage:', e);
      return { clock: true, weather: true, calendar: true, news: true };
    }
  });

  const [layout, setLayout] = useState(() => {
    try {
      const stored = localStorage.getItem('layout');
      const defaultLayout = [
        'clock',     // position 0
        'weather',   // position 1
        'calendar',  // position 2
        null,        // position 3
        null,        // position 4
        null,        // position 5
        null,        // position 6
        null,        // position 7
        null,        // position 8
      ];
      return {
        widgets: stored ? JSON.parse(stored) : defaultLayout
      };
    } catch (e) {
      console.error('Error parsing layout from localStorage:', e);
      return {
        widgets: [
          'clock',     // position 0
          'weather',   // position 1
          'calendar',  // position 2
          null,        // position 3
          null,        // position 4
          null,        // position 5
          null,        // position 6
          null,        // position 7
          null,        // position 8
        ]
      };
    }
  });

  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      Object.keys(updated).forEach(key => {
        localStorage.setItem(key, updated[key]);
      });
      return updated;
    });
    addNotification('Settings saved', 'success');
  }, [addNotification]);

  const updateLayout = useCallback((newLayout) => {
    setLayout({ widgets: newLayout });
    localStorage.setItem('layout', JSON.stringify(newLayout));
    addNotification('Layout saved', 'success');
  }, [addNotification]);

  const updateFadeSettings = useCallback((newFadeSettings) => {
    setFadeSettings(newFadeSettings);
    localStorage.setItem('fadeSettings', JSON.stringify(newFadeSettings));
    addNotification('Fade settings updated', 'success');
  }, [addNotification]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    widgets,
    setWidgets,
    settings,
    updateSettings,
    layout,
    updateLayout,
    fadeSettings,
    updateFadeSettings,
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
};
