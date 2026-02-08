import React, { useState, useMemo, useEffect, useCallback } from 'react';
import DotGrid from './DotGrid';
import DayView from './DayView';
import { getCalendars, getHabitStatus, toggleHabit, getAllHabitEntries } from '../utils/storage';
import type { CalendarConfig } from '../utils/storage';

interface CalendarViewProps {
    calendarId: string;
    onBack: () => void;
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

const CalendarView: React.FC<CalendarViewProps> = ({ calendarId, onBack }) => {
    const [focusedDate, setFocusedDate] = useState<Date | null>(null);
    const [zoomOrigin, setZoomOrigin] = useState<{ x: number, y: number } | null>(null);
    const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);
    const [calendarConfig, setCalendarConfig] = useState<CalendarConfig | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Load calendar config
    useEffect(() => {
        const calendars = getCalendars();
        const config = calendars.find(c => c.id === calendarId);
        setCalendarConfig(config || null);
    }, [calendarId]);

    const { totalDots, passedDots, title, subtitle, startDate, customDotSize, customGap } = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const yearDots = 365;
        const diffTime = Math.abs(now.getTime() - startOfYear.getTime());
        const daysPassed = Math.floor(diffTime / MILLISECONDS_PER_DAY);
        const dayNumber = daysPassed + 1;
        const percentage = ((dayNumber / yearDots) * 100).toFixed(1);

        return {
            totalDots: yearDots,
            passedDots: daysPassed,
            title: calendarConfig ? calendarConfig.name : `Year ${currentYear}`,
            subtitle: `Day ${dayNumber} of ${yearDots} (${percentage}%)`,
            startDate: startOfYear,
            customDotSize: 10,
            customGap: 8
        };
    }, [calendarConfig]);

    // Pre-calculated statuses for Main calendar performance
    const [allHabitData, setAllHabitData] = useState<{ id: string, type: string, entries: Record<string, boolean> }[]>([]);

    useEffect(() => {
        if (calendarConfig?.type === 'main') {
            const calendars = getCalendars().filter(c => c.type !== 'main');
            const data = calendars.map(c => ({
                id: c.id,
                type: c.type,
                entries: getAllHabitEntries(c.id)
            }));
            setAllHabitData(data);
        }
    }, [calendarConfig, refreshTrigger]);

    // Dynamic Dot Coloring Logic
    const getDotColor = useCallback((index: number): string | null => {
        if (!calendarConfig) return null;

        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // Future dots are always default
        if (index > passedDots) return null;

        // Habit Calendars
        if (calendarConfig.type === 'habit_good' || calendarConfig.type === 'habit_bad') {
            const isCompleted = getHabitStatus(calendarId, date);
            if (isCompleted) {
                return calendarConfig.type === 'habit_good' ? '#00ff88' : '#ff4444';
            }
            return null;
        }

        // Main Calendar (Aggregation)
        if (calendarConfig.type === 'main') {
            let goodCount = 0;
            let badCount = 0;
            let totalGoodPossible = 0;
            let totalBadPossible = 0;

            allHabitData.forEach(hc => {
                if (hc.type === 'habit_good') {
                    totalGoodPossible++;
                    if (hc.entries[dateKey]) goodCount++;
                } else if (hc.type === 'habit_bad') {
                    totalBadPossible++;
                    if (hc.entries[dateKey]) badCount++;
                }
            });

            if (goodCount === 0 && badCount === 0) return null;

            // Simple Blending Logic:
            // Score = (Good - Bad)
            // Color intensity based on ratio
            const score = goodCount - badCount;

            if (score > 0) {
                const intensity = Math.min(0.2 + (score / (totalGoodPossible || 1)) * 0.8, 1);
                return `rgba(0, 255, 136, ${intensity})`;
            } else if (score < 0) {
                const intensity = Math.min(0.2 + (Math.abs(score) / (totalBadPossible || 1)) * 0.8, 1);
                return `rgba(255, 68, 68, ${intensity})`;
            } else {
                // Neutral but active
                return 'rgba(255, 255, 255, 0.3)';
            }
        }

        return null;
    }, [calendarId, calendarConfig, startDate, passedDots, refreshTrigger, allHabitData]);


    const handleDotClick = (index: number, x: number, y: number) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        const isFuture = index > passedDots;

        if (calendarConfig?.type === 'habit_good' || calendarConfig?.type === 'habit_bad') {
            // Only toggle for today or past
            if (!isFuture) {
                toggleHabit(calendarId, date);
                setRefreshTrigger(prev => prev + 1);
            }
        } else {
            // General calendar allows opening DayView even for future dots
            setZoomOrigin({ x, y });
            setZoomedIndex(index);
            setFocusedDate(date);
        }
    };

    const handleNavigate = (newDate: Date) => {
        const diffTime = newDate.getTime() - startDate.getTime();
        const newIndex = Math.floor(diffTime / MILLISECONDS_PER_DAY);

        setZoomOrigin(null);
        setZoomedIndex(newIndex);
        setFocusedDate(newDate);
    };

    return (
        <div className={`calendar-view ${zoomedIndex !== null ? 'zoomed' : ''}`}>

            <div className={`calendar-controls ${zoomedIndex !== null ? 'hidden' : ''}`}>
                <button className="dashboard-back-btn" onClick={onBack}>
                    ← Dashboard
                </button>
            </div>

            <div className="header-section">
                <header className={zoomedIndex !== null ? 'hidden' : ''}>
                    <h1>{title}</h1>
                    <p className="subtitle">{subtitle}</p>
                </header>
            </div>

            <DotGrid
                totalDots={totalDots}
                passedDots={passedDots}
                onDotClick={handleDotClick}
                customDotSize={10}
                customGap={8}
                zoomedIndex={zoomedIndex}
                getDotColor={getDotColor}
                key={`${calendarId}-${refreshTrigger}`} // Force update if needed
            />

            {focusedDate && (
                <DayView
                    date={focusedDate}
                    isVisible={zoomedIndex !== null}
                    onBack={() => {
                        setZoomedIndex(null);
                        setFocusedDate(null);
                        setRefreshTrigger(prev => prev + 1); // Refresh status when coming back
                    }}
                    onNavigate={handleNavigate}
                    initialPosition={zoomOrigin || undefined}
                    isOverlay={true}
                />
            )}

            <style>{`
                .calendar-view {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    padding-top: 2rem;
                    background: #111;
                    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                }
                
                .calendar-controls {
                    position: absolute;
                    top: 2rem;
                    left: 2rem;
                    z-index: 50;
                    transition: opacity 0.3s ease;
                }
                
                .calendar-controls.hidden {
                    opacity: 0;
                    pointer-events: none;
                }

                .dashboard-back-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: rgba(255, 255, 255, 0.8);
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    backdrop-filter: blur(12px);
                }

                .dashboard-back-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                    transform: translateX(-4px);
                }
                
                .header-section {
                    width: 100%;
                    height: 160px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                header {
                    text-align: center;
                    transition: all 0.5s ease;
                }
                
                header.hidden {
                    opacity: 0;
                    transform: translateY(-20px);
                    pointer-events: none;
                }
                
                h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(to right, #fff, #666);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.04em;
                }
                .subtitle {
                    color: #555;
                    font-size: 1.2rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
};

export default CalendarView;
