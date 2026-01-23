import { useState, useMemo } from 'react';
import DotGrid from './components/DotGrid';
import Controls, { type ViewMode } from './components/Controls';
import DayView from './components/DayView';
import './index.css';

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function App() {
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(80);
  const [viewMode, setViewMode] = useState<ViewMode>('LIFE');

  // For Day View
  const [focusedDate, setFocusedDate] = useState<Date | null>(null);
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number, y: number } | null>(null);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  const { totalDots, passedDots, title, subtitle, startDate, customDotSize, customGap } = useMemo(() => {
    const now = new Date();
    const start = new Date(birthDate);

    if (isNaN(start.getTime())) {
      return { totalDots: 0, passedDots: 0, title: 'Invalid Date', subtitle: '', startDate: start, customDotSize: 6, customGap: 4 };
    }

    if (viewMode === 'LIFE') {
      const end = new Date(start);
      end.setFullYear(start.getFullYear() + lifeExpectancy);

      const totalDays = Math.floor((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY);
      const passedDays = Math.floor((now.getTime() - start.getTime()) / MILLISECONDS_PER_DAY);

      const yearsPassed = (passedDays / 365.25).toFixed(1);
      const percentage = Math.min(100, Math.max(0, (passedDays / totalDays) * 100)).toFixed(1);

      return {
        totalDots: Math.max(0, totalDays),
        passedDots: Math.max(0, passedDays),
        title: 'Life in Days',
        subtitle: `${yearsPassed} years passed (${percentage}%)`,
        startDate: start,
        customDotSize: 6,
        customGap: 4
      };
    } else if (viewMode === 'YEAR') {
      const currentYear = now.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear + 1, 0, 1);

      const totalDays = Math.floor((endOfYear.getTime() - startOfYear.getTime()) / MILLISECONDS_PER_DAY);
      const passedDays = Math.floor((now.getTime() - startOfYear.getTime()) / MILLISECONDS_PER_DAY);
      const percentage = ((passedDays / totalDays) * 100).toFixed(1);

      return {
        totalDots: totalDays,
        passedDots: passedDays,
        title: `Year ${currentYear}`,
        subtitle: `Day ${passedDays + 1} of ${totalDays} (${percentage}%)`,
        startDate: startOfYear,
        customDotSize: 8,
        customGap: 6
      };
    } else if (viewMode === 'MONTH') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

      const totalDots = Math.floor((endOfMonth.getTime() - startOfMonth.getTime()) / MILLISECONDS_PER_DAY);
      const passedDots = now.getDate() - 1; // 0-indexed passed days
      const percentage = ((passedDots / totalDots) * 100).toFixed(1);

      return {
        totalDots,
        passedDots,
        title: startOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        subtitle: `Day ${passedDots + 1} of ${totalDots} (${percentage}%)`,
        startDate: startOfMonth,
        customDotSize: 20,
        customGap: 10
      };
    } else if (viewMode === 'WEEK') {
      // Find start of week (Sunday)
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const totalDots = 7;
      const passedDots = dayOfWeek; // 0 = Sunday, 1 = Monday. so passedDots is exactly current day index

      return {
        totalDots,
        passedDots,
        title: 'Current Week',
        subtitle: `${now.toLocaleDateString(undefined, { weekday: 'long' })}`,
        startDate: startOfWeek,
        customDotSize: 40,
        customGap: 20
      };
    }

    return { totalDots: 0, passedDots: 0, title: '', subtitle: '', startDate: new Date(), customDotSize: 6, customGap: 4 };
  }, [birthDate, lifeExpectancy, viewMode]);

  const handleDotClick = (index: number, x: number, y: number) => {
    // Calculate date for the clicked dot
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    setZoomOrigin({ x, y });
    setZoomedIndex(index);
    setFocusedDate(date);
  };

  return (
    <div className={`app-container ${zoomedIndex !== null ? 'zoomed' : ''}`}>
      {zoomedIndex === null && (
        <>
          <header>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </header>

          <Controls
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            lifeExpectancy={lifeExpectancy}
            setLifeExpectancy={setLifeExpectancy}
          />
        </>
      )}

      <DotGrid
        totalDots={totalDots}
        passedDots={passedDots}
        onDotClick={handleDotClick}
        customDotSize={customDotSize}
        customGap={customGap}
        zoomedIndex={zoomedIndex}
      />

      {focusedDate && (
        <DayView
          key={focusedDate.toISOString()}
          date={focusedDate}
          onBack={() => {
            setFocusedDate(null);
            setZoomedIndex(null);
          }}
          initialPosition={zoomOrigin || undefined}
          isOverlay={true}
        />
      )}

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          transition: padding 0.5s ease;
        }
        .app-container.zoomed {
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }
        header {
          text-align: center;
          margin-bottom: 2rem;
        }
        h1 {
          font-size: 3rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(to right, #fff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          color: #666;
          font-size: 1.2rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default App;
