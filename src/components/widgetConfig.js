export const WIDGET_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'clock', label: 'Clock' },
  { value: 'weather', label: 'Weather' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'news', label: 'News' },
  { value: 'compliments', label: 'Compliments' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'airquality', label: 'Air Quality' },
  { value: 'sports', label: 'Sports' },
];

export const WIDGET_LABELS = {
  clock: 'Clock',
  weather: 'Weather',
  calendar: 'Calendar',
  news: 'News',
  compliments: 'Compliments',
  stocks: 'Stocks',
  crypto: 'Crypto',
  airquality: 'Air Quality',
  sports: 'Sports',
};

export const GRID_LAYOUT = [
  { row: 1, cols: '3-6-3', positions: [0, 1, 2] },
  { row: 2, cols: '3-6-3', positions: [3, 4, 5] },
  { row: 3, cols: '12', positions: [6] },
];

export const POSITION_LABELS = {
  0: 'Top Left',
  1: 'Top Middle',
  2: 'Top Right',
  3: 'Middle Left',
  4: 'Middle Middle',
  5: 'Middle Right',
  6: 'Bottom',
};

export const DEFAULT_WIDGET_FADE = {
  clock: false,
  weather: true,
  calendar: false,
  news: false,
  compliments: false,
  stocks: false,
  crypto: false,
  airquality: false,
  sports: false,
};

export const DEFAULT_LAYOUT = [
  'clock',
  'compliments',
  'weather',
  null,
  null,
  null,
  'news',
];

export const LAYOUT_SLOT_COUNT = 7;

export const getPositionLabel = (position) => POSITION_LABELS[position] || `Position ${position + 1}`;

export const normalizeLayoutWidgets = (layoutWidgets = []) =>
  Array.from({ length: LAYOUT_SLOT_COUNT }, (_, index) => {
    if (index < layoutWidgets.length) {
      return layoutWidgets[index] ?? null;
    }

    return DEFAULT_LAYOUT[index] ?? null;
  });

export const createWidgetSettingsForType = (widgetType, defaults = {}) => {
  switch (widgetType) {
    case 'clock':
      return {
        widgetType,
        clockFormat: defaults.clockFormat || '24h',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.clock,
      };
    case 'weather':
      return {
        widgetType,
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        tempUnit: defaults.tempUnit || 'F',
        clockFormat: defaults.clockFormat || '24h',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.weather,
      };
    case 'calendar':
      return {
        widgetType,
        icsUrl: defaults.icsUrl || '',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.calendar,
      };
    case 'news':
      return {
        widgetType,
        newsApiKey: defaults.newsApiKey || '',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.news,
      };
    case 'compliments':
      return {
        widgetType,
        complimentsConfigUrl: defaults.complimentsConfigUrl || '',
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.compliments,
      };
    case 'stocks':
      return {
        widgetType,
        finnhubApiKey: defaults.finnhubApiKey || '',
        stockTickers: defaults.stockTickers || [],
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.stocks,
      };
    case 'crypto':
      return {
        widgetType,
        cryptoCoins: defaults.cryptoCoins || ['bitcoin', 'ethereum'],
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.crypto,
      };
    case 'airquality':
      return {
        widgetType,
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.airquality,
      };
    case 'sports':
      return {
        widgetType,
        sportsLeagues: defaults.sportsLeagues || [],
        sportsTeams: defaults.sportsTeams || '',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.sports,
      };
    default:
      return {
        widgetType,
        showFade: defaults.showFade ?? false,
      };
  }
};
