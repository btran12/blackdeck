# React MagicMirror

A modern, interactive dashboard application built with React and Vite that displays real-time information through customizable widgets. Inspired by the MagicMirror concept, this application provides a beautiful, dark-themed interface for monitoring weather, news, stocks, crypto, sports, air quality, and more.

## 🌟 Features

### Interactive Dashboard
- **Hover Effects**: Widgets rise with elevation and white borders on hover
- **Per-Widget Editing**: Click any widget to customize settings
- **Add/Remove Widgets**: Easily add new widgets to empty slots
- **Multiple Presets**: Choose from 4 layout configurations
- **Dark Theme**: Sleek dark interface with gradient background
- **Responsive Design**: Adapts to different screen sizes

### Widgets Included
- **Clock** 🕐 - Real-time clock with 12/24 format toggle
- **Weather** 🌤️ - Current conditions and forecasts via OpenWeatherMap
- **Calendar** 📅 - Interactive monthly calendar with date highlighting
- **News** 📰 - Latest headlines from NewsAPI
- **Stocks** 📈 - Stock ticker prices from Finnhub
- **Crypto** 💰 - Cryptocurrency prices and updates
- **Sports** ⚽ - Sports scores and updates
- **Air Quality** 💨 - Local air quality monitoring
- **Compliments** 💬 - Random compliments display

### Configuration
- **Global Default API Keys**: Set default keys for all services
- **Per-Widget Settings**: Override defaults for individual widgets
- **Layout Presets**:
  - **Classic** (7-slot layout): Standard 3-row grid
  - **Spotlight** (8-slot layout): Asymmetric layout with highlighted widget
  - **Quad + Footer** (7-slot layout): 2x2 grid with footer section
  - **3x3 Grid** (9-slot layout): Uniform 3x3 grid

### Smart Features
- **API Key Fallback**: Widgets fallback to global default keys when not specifically configured
- **Settings Auto-Hide**: Settings button fades after 5 seconds of mouse inactivity
- **Persistent Configuration**: All settings saved to localStorage
- **Smooth Animations**: CSS transitions for all interactions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/btran12/react-magicmirror.git
cd react-magicmirror

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173` with HMR enabled for instant updates.

### Production Build

```bash
npm run build
npm run preview
```

## 🔑 API Keys Configuration

The application requires API keys from various services. You can set them globally in the Settings panel or per-widget in the dashboard.

### OpenWeatherMap (Weather Widget)
1. Visit [openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for a free account
3. Copy your API key from account settings
4. Add to Settings panel under "Weather API Key"

### NewsAPI (News Widget)
1. Visit [newsapi.org](https://newsapi.org)
2. Create a free account
3. Copy your API key from the dashboard
4. Add to Settings panel under "News API Key"

### Finnhub (Stocks Widget)
1. Visit [finnhub.io](https://finnhub.io)
2. Register for a free account
3. Get your API key from the dashboard
4. Add to Settings panel under "Stocks API Key"

## 📁 Project Structure

```
react-magicmirror/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx              # Main dashboard grid layout
│   │   ├── SettingsPanel.jsx          # Settings and configuration modal
│   │   ├── Notifications.jsx          # Toast notification system
│   │   ├── Widget.jsx                 # Base widget wrapper
│   │   └── widgets/
│   │       ├── Clock.jsx
│   │       ├── Weather.jsx
│   │       ├── Calendar.jsx
│   │       ├── News.jsx
│   │       ├── Stocks.jsx
│   │       ├── Crypto.jsx
│   │       ├── Sports.jsx
│   │       ├── AirQuality.jsx
│   │       └── Compliments.jsx
│   ├── context/
│   │   └── WidgetContext.jsx          # Global state management
│   ├── hooks/
│   │   └── useAPI.js                  # Custom API fetching hook
│   ├── config/
│   │   └── widgetConfig.js            # Widget metadata & layout presets
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
│   └── compliments.json               # Compliments data
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

## 🎮 Usage Guide

### Dashboard Navigation
1. **Hover over widgets**: Widgets lift with shadow and white border appears
2. **Click on a widget**: Opens the settings modal for that widget
3. **Click on empty slot**: Choose a widget type and configure settings
4. **Remove widget**: Open slot editor and click "Remove Widget"

### Settings Panel
1. Click the **settings icon** (appears on mouse movement) in the top-right
2. **Select Layout Preset**: Choose your preferred dashboard layout
3. **Set Default API Keys**: Configure keys for Weather, News, and Stocks
4. **Per-Widget Override**: Configure individual widget keys in dashboard

### Adding a New Widget
1. Locate an empty slot on the dashboard
2. Hover to reveal the "Add Widget" prompt
3. Click to open the widget selector
4. Choose widget type and configure settings
5. Click "Save" to add to dashboard

## 🛠️ Technology Stack

### Frontend
- **React 19.2.4** - UI library
- **Vite 8.0.1** - Build tool
- **Tailwind CSS 4.2.2** - Styling
- **Material-UI (MUI)** - Component library

### State Management
- React Context API - Global state
- localStorage - Persistent configuration

### Dev Tools
- ESLint - Code linting
- PostCSS - CSS processing

## ⚙️ Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎨 Customization

### Adding a New Widget

1. Create `src/components/widgets/MyWidget.jsx`:

```jsx
import { Widget } from '../Widget';

export const MyWidget = () => {
  return (
    <Widget title="My Widget">
      <div>Your content here</div>
    </Widget>
  );
};
```

2. Register in `src/config/widgetConfig.js`:

```javascript
export const WIDGET_TYPES = {
  myWidget: {
    id: 'myWidget',
    name: 'My Widget',
    component: MyWidget,
    defaultSettings: {
      // your settings here
    }
  }
};
```

### Changing the Theme

Edit `tailwind.config.js` to modify colors:

```javascript
colors: {
  gray: {
    950: '#050812',  // Background
    900: '#0a0e27',  // Secondary background
    // ... other colors
  }
}
```

### Creating a Custom Layout Preset

Edit `src/config/widgetConfig.js`:

```javascript
export const LAYOUT_PRESETS = {
  custom: {
    id: 'custom',
    name: 'Custom Layout',
    gridTemplateRows: 'repeat(3, 1fr)',
    rows: [
      // Define your row structure
    ]
  }
};
```

## 🐛 Troubleshooting

### API Key Not Working
- Verify the key is correct in Settings panel
- Check API service status
- Ensure rate limits haven't been exceeded
- Try removing and re-adding the widget

### Widget Not Updating
- Check browser console for errors
- Verify API key is configured
- Clear localStorage and refresh: `localStorage.clear()`
- Restart the development server

### Layout Not Saving
- Check browser console for storage quota errors
- Try clearing localStorage
- Ensure localStorage is enabled in browser

## 📦 Dependencies

See [package.json](package.json) for complete dependency list.

Core dependencies:
- `react` - React library
- `react-dom` - React DOM rendering
- `@mui/material` - Material Design components
- `@emotion/react` & `@emotion/styled` - Styling

## 🚀 Deployment

### Deploy to Vercel

```bash
npm run build
vercel
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

Update `vite.config.js`:
```javascript
export default {
  base: '/react-magicmirror/',
}
```

Then:
```bash
npm run build
git add dist -f
git commit -m "Deploy"
git push
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by [MagicMirror²](https://magicmirror.builders/)
- Widget icons from Material-UI
- API services: OpenWeatherMap, NewsAPI, Finnhub
- Built with React and Vite

## 📞 Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/btran12/react-magicmirror).

---

**Last Updated**: March 2026 - Latest version includes interactive dashboard with hover effects, layout presets, and per-widget configuration.
