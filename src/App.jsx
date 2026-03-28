import { WidgetProvider } from './context/WidgetContext'
import { Dashboard } from './components/Dashboard'
import './App.css'

function App() {
  return (
    <WidgetProvider>
      <Dashboard />
    </WidgetProvider>
  )
}

export default App
