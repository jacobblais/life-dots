import { useState } from 'react';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import './index.css';

type ViewType = 'dashboard' | 'calendar' | 'profile' | 'settings';

function App() {
  const [view, setView] = useState<ViewType>('dashboard');
  const [activeCalendarId, setActiveCalendarId] = useState<string>('main');

  const handleNavigate = (newView: ViewType, calendarId?: string) => {
    if (calendarId) setActiveCalendarId(calendarId);
    setView(newView);
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard onNavigate={(_, id) => handleNavigate('calendar', id)} onOpenView={(v) => handleNavigate(v)} />;
      case 'calendar':
        return <CalendarView calendarId={activeCalendarId} onBack={() => setView('dashboard')} />;
      case 'profile':
        return (
          <div className="placeholder-view">
            <button className="back-btn" onClick={() => setView('dashboard')}>← Dashboard</button>
            <h1>Profile</h1>
            <p>User profile and statistics coming soon.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="placeholder-view">
            <button className="back-btn" onClick={() => setView('dashboard')}>← Dashboard</button>
            <h1>Settings</h1>
            <p>App settings and customization coming soon.</p>
          </div>
        );
      default:
        return <Dashboard onNavigate={(_, id) => handleNavigate('calendar', id)} onOpenView={(v) => handleNavigate(v)} />;
    }
  };

  return (
    <div className="app-container">
      {renderView()}

      <style>{`
        .app-container {
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111;
        }

        .placeholder-view {
            text-align: center;
            color: #fff;
            padding: 2rem;
        }

        .placeholder-view h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .placeholder-view p {
            color: #888;
            font-size: 1.2rem;
        }

        .back-btn {
            position: absolute;
            top: 2rem;
            left: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: #fff;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .back-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

export default App;
