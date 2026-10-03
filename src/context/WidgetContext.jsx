import React, { createContext, useState, useCallback, useEffect } from 'react';
import {
  createWidgetSettingsForType,
  DEFAULT_FONT_FAMILY,
  DEFAULT_LAYOUT,
  DEFAULT_LAYOUT_PRESET,
  DEFAULT_WIDGET_FADE,
  normalizeLayoutPreset,
  normalizeLayoutWidgets,
} from '../components/widgetConfig';

export const WidgetContext = createContext();

const parseStoredArray = (rawValue) => {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeIcsUrl = (value) => String(value || '').trim();

const normalizeIcsHistory = (history) => {
  if (!Array.isArray(history)) return [];

  const seen = new Set();
  const normalized = [];

  history.forEach((item) => {
    const url = normalizeIcsUrl(item);
    if (!url || seen.has(url)) return;
    seen.add(url);
    normalized.push(url);
  });

  return normalized.slice(0, 20);
};

const appendIcsHistory = (history, icsUrl) => {
  const url = normalizeIcsUrl(icsUrl);
  if (!url) return normalizeIcsHistory(history);

  const existing = normalizeIcsHistory(history).filter((item) => item !== url);
  return [url, ...existing].slice(0, 20);
};

const collectIcsUrlsFromWidgetSettings = (layoutWidgets, widgetSettingsMap) => {
  const urls = [];

  layoutWidgets.forEach((widgetType, position) => {
    if (widgetType !== 'calendar') return;

    const icsUrl = normalizeIcsUrl(widgetSettingsMap?.[position]?.icsUrl);
    if (icsUrl) {
      urls.push(icsUrl);
    }

    const selectedUrls = Array.isArray(widgetSettingsMap?.[position]?.calendarSelectedIcsUrls)
      ? widgetSettingsMap[position].calendarSelectedIcsUrls
      : [];
    selectedUrls.forEach((item) => {
      const selected = normalizeIcsUrl(item);
      if (selected) {
        urls.push(selected);
      }
    });
  });

  return normalizeIcsHistory(urls);
};

const persistSettingItem = (key, value) => {
  if (Array.isArray(value)) {
    localStorage.setItem(key, JSON.stringify(value));
    return;
  }

  localStorage.setItem(key, value ?? '');
};

const getInitialSettings = () => ({
  openweatherApiKey: localStorage.getItem('openweatherApiKey') || '',
  newsApiKey: localStorage.getItem('newsApiKey') || '',
  currentsApiKey: localStorage.getItem('currentsApiKey') || '',
  finnhubApiKey: localStorage.getItem('finnhubApiKey') || '',
  apiNinjasApiKey: localStorage.getItem('apiNinjasApiKey') || '',
  location: localStorage.getItem('location') || 'New York, New York',
  tempUnit: localStorage.getItem('tempUnit') || 'F',
  clockFormat: localStorage.getItem('clockFormat') || '24h',
  icsUrl: localStorage.getItem('icsUrl') || '',
  calendarIcsHistory: normalizeIcsHistory(parseStoredArray(localStorage.getItem('calendarIcsHistory'))),
  complimentsConfigUrl: localStorage.getItem('complimentsConfigUrl') || '',
  quietHoursEnabled: localStorage.getItem('quietHoursEnabled') === 'true',
  quietHoursStart: localStorage.getItem('quietHoursStart') || '23:00',
  quietHoursEnd: localStorage.getItem('quietHoursEnd') || '06:00',
  fontFamily: localStorage.getItem('fontFamily') || DEFAULT_FONT_FAMILY,
});

const getInitialFadeSettings = () => {
  try {
    const stored = localStorage.getItem('fadeSettings');
    if (!stored) return DEFAULT_WIDGET_FADE;

    const parsed = JSON.parse(stored);
    return { ...DEFAULT_WIDGET_FADE, ...parsed };
  } catch (e) {
    console.error('Error parsing fadeSettings from localStorage:', e);
    return DEFAULT_WIDGET_FADE;
  }
};

const getInitialLayout = () => {
  try {
    const stored = localStorage.getItem('layout');
    const widgets = stored ? normalizeLayoutWidgets(JSON.parse(stored)) : DEFAULT_LAYOUT;
    const preset = normalizeLayoutPreset(localStorage.getItem('layoutPreset') || DEFAULT_LAYOUT_PRESET);
    return {
      widgets,
      preset,
    };
  } catch (e) {
    console.error('Error parsing layout from localStorage:', e);
    return {
      widgets: DEFAULT_LAYOUT,
      preset: DEFAULT_LAYOUT_PRESET,
    };
  }
};

const getWidgetDefaults = (widgetType, settings, fadeSettings) =>
  createWidgetSettingsForType(widgetType, {
    ...settings,
    showFade: fadeSettings[widgetType],
  });

const buildWidgetSettingsForLayout = (layoutWidgets, storedWidgetSettings, settings, fadeSettings) => {
  const nextWidgetSettings = {};

  layoutWidgets.forEach((widgetType, position) => {
    if (!widgetType) return;

    const defaults = getWidgetDefaults(widgetType, settings, fadeSettings);
    const storedSettings = storedWidgetSettings?.[position];

    if (storedSettings?.widgetType === widgetType) {
      nextWidgetSettings[position] = {
        ...defaults,
        ...storedSettings,
        widgetType,
      };
      return;
    }

    nextWidgetSettings[position] = defaults;
  });

  return nextWidgetSettings;
};

const getInitialWidgetSettings = (layoutWidgets, settings, fadeSettings) => {
  try {
    const stored = localStorage.getItem('widgetSettings');
    const parsed = stored ? JSON.parse(stored) : {};
    return buildWidgetSettingsForLayout(layoutWidgets, parsed, settings, fadeSettings);
  } catch (e) {
    console.error('Error parsing widgetSettings from localStorage:', e);
    return buildWidgetSettingsForLayout(layoutWidgets, {}, settings, fadeSettings);
  }
};

export const WidgetProvider = ({ children }) => {
  const [widgets, setWidgets] = useState([
    { id: 1, type: 'clock', title: 'Clock', size: 'medium' },
    { id: 2, type: 'weather', title: 'Weather', size: 'large' },
    { id: 3, type: 'calendar', title: 'Calendar', size: 'medium' },
    { id: 4, type: 'news', title: 'News', size: 'large' },
    { id: 5, type: 'compliments', title: 'Compliments', size: 'medium' },
  ]);

  const [layout, setLayout] = useState(getInitialLayout);

  const [settings, setSettings] = useState(getInitialSettings);
  const [fadeSettings, setFadeSettings] = useState(getInitialFadeSettings);
  const [widgetSettings, setWidgetSettings] = useState(() =>
    getInitialWidgetSettings(layout.widgets, getInitialSettings(), getInitialFadeSettings())
  );

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', settings.fontFamily);
  }, [settings.fontFamily]);

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
        persistSettingItem(key, updated[key]);
      });
      return updated;
    });
    addNotification('Settings saved', 'success');
  }, [addNotification]);

  const updateLayout = useCallback((newLayout, preset = layout.preset) => {
    const normalizedLayout = normalizeLayoutWidgets(newLayout);
    const normalizedPreset = normalizeLayoutPreset(preset);
    setLayout({ widgets: normalizedLayout, preset: normalizedPreset });
    localStorage.setItem('layout', JSON.stringify(normalizedLayout));
    localStorage.setItem('layoutPreset', normalizedPreset);
    addNotification('Layout saved', 'success');
  }, [addNotification, layout.preset]);

  const updateWidgetSettings = useCallback((newWidgetSettings, layoutWidgets = layout.widgets, settingsOverride = settings, fadeSettingsOverride = fadeSettings) => {
    const next = buildWidgetSettingsForLayout(layoutWidgets, newWidgetSettings, settingsOverride, fadeSettingsOverride);
    setWidgetSettings(next);
    localStorage.setItem('widgetSettings', JSON.stringify(next));
    addNotification('Widget settings saved', 'success');
  }, [addNotification, fadeSettings, layout.widgets, settings]);

  const saveDashboardConfiguration = useCallback((newLayout, newWidgetSettings, newSettings, preset = layout.preset) => {
    const normalizedLayout = normalizeLayoutWidgets(newLayout);
    const normalizedPreset = normalizeLayoutPreset(preset);
    setLayout({ widgets: normalizedLayout, preset: normalizedPreset });
    localStorage.setItem('layout', JSON.stringify(normalizedLayout));
    localStorage.setItem('layoutPreset', normalizedPreset);

    const nextWidgetSettings = buildWidgetSettingsForLayout(normalizedLayout, newWidgetSettings, newSettings, fadeSettings);

    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      const rememberedIcsUrls = collectIcsUrlsFromWidgetSettings(normalizedLayout, nextWidgetSettings);
      const updated = {
        ...merged,
        calendarIcsHistory: normalizeIcsHistory([
          ...(merged.calendarIcsHistory || []),
          ...rememberedIcsUrls,
        ]),
      };
      Object.keys(updated).forEach(key => {
        persistSettingItem(key, updated[key]);
      });
      return updated;
    });

    setWidgetSettings(nextWidgetSettings);
    localStorage.setItem('widgetSettings', JSON.stringify(nextWidgetSettings));

    addNotification('Settings saved', 'success');
  }, [addNotification, fadeSettings, layout.preset]);

  const updateFadeSettings = useCallback((newFadeSettings) => {
    setFadeSettings(newFadeSettings);
    localStorage.setItem('fadeSettings', JSON.stringify(newFadeSettings));
    addNotification('Fade settings updated', 'success');
  }, [addNotification]);

  const getWidgetSettingsForPosition = useCallback((position, widgetType = layout.widgets[position]) => {
    if (!widgetType) return null;

    const currentSettings = widgetSettings[position];
    if (currentSettings?.widgetType === widgetType) {
      return currentSettings;
    }

    return getWidgetDefaults(widgetType, settings, fadeSettings);
  }, [fadeSettings, layout.widgets, settings, widgetSettings]);

  const saveWidgetConfiguration = useCallback((position, widgetType, newWidgetSettings) => {
    const nextLayout = normalizeLayoutWidgets(layout.widgets);
    nextLayout[position] = widgetType || null;

    const nextStoredSettings = { ...widgetSettings };

    if (!widgetType) {
      delete nextStoredSettings[position];
    } else {
      nextStoredSettings[position] = {
        ...getWidgetDefaults(widgetType, settings, fadeSettings),
        ...newWidgetSettings,
        widgetType,
      };
    }

    const normalizedWidgetSettings = buildWidgetSettingsForLayout(
      nextLayout,
      nextStoredSettings,
      settings,
      fadeSettings
    );

    setLayout({ widgets: nextLayout, preset: layout.preset });
    setWidgetSettings(normalizedWidgetSettings);

    if (widgetType === 'calendar') {
      setSettings((prev) => {
        const selectedUrls = Array.isArray(newWidgetSettings?.calendarSelectedIcsUrls)
          ? newWidgetSettings.calendarSelectedIcsUrls
          : [];

        let history = appendIcsHistory(prev.calendarIcsHistory, newWidgetSettings?.icsUrl);
        history = normalizeIcsHistory([...history, ...selectedUrls]);

        const nextSettings = {
          ...prev,
          calendarIcsHistory: history,
        };
        persistSettingItem('calendarIcsHistory', history);
        return nextSettings;
      });
    }

    localStorage.setItem('layout', JSON.stringify(nextLayout));
    localStorage.setItem('layoutPreset', layout.preset);
    localStorage.setItem('widgetSettings', JSON.stringify(normalizedWidgetSettings));

    addNotification(widgetType ? 'Widget updated' : 'Widget removed', 'success');
  }, [addNotification, fadeSettings, layout.widgets, settings, widgetSettings]);

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
    widgetSettings,
    updateWidgetSettings,
    saveDashboardConfiguration,
    saveWidgetConfiguration,
    getWidgetSettingsForPosition,
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
