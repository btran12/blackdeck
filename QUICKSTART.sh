#!/bin/bash
# Quick start guide for React MagicMirror

echo "React MagicMirror - Quick Start"
echo "=============================="
echo ""
echo "1. Setting up dependencies..."
npm install

echo ""
echo "2. Creating .env.local file..."
cp .env.example .env.local

echo ""
echo "3. Please edit .env.local and add your API keys:"
echo "   - VITE_OPENWEATHER_API_KEY: Get from https://openweathermap.org/api"
echo "   - VITE_NEWS_API_KEY: Get from https://newsapi.org/"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Build for production:"
echo "   npm run build"
echo ""
echo "Setup complete! 🚀"
