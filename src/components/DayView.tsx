import React, { useState, useEffect } from 'react';
import {
    getCalendars,
    getHabitStatus,
    toggleHabit
} from '../utils/storage';
import type { CalendarConfig } from '../utils/storage';

interface DayViewProps {
    date: Date;
    onBack: () => void;
    initialPosition?: { x: number, y: number };
    isOverlay?: boolean;
    isVisible?: boolean;
}

const DayView: React.FC<DayViewProps> = ({ date, onBack, initialPosition, isOverlay, isVisible = true }) => {
    const [habitCalendars, setHabitCalendars] = useState<CalendarConfig[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Check if it's tomorrow or later
    const isFuture = (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        return target > today;
    })();

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                onBack();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onBack]);

    useEffect(() => {
        // Load habit calendars
        const allCals = getCalendars();
        setHabitCalendars(allCals.filter(c => c.type !== 'main'));
    }, [date, refreshTrigger]);

    const handleToggleHabit = (id: string) => {
        if (isFuture) return; // Cannot edit future habits
        toggleHabit(id, date);
        setRefreshTrigger(prev => prev + 1);
    };

    const animationStyle: React.CSSProperties = initialPosition ? {
        transformOrigin: `${initialPosition.x}px ${initialPosition.y}px`,
        animation: 'zoomIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease'
    } : {
        animation: 'popIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease'
    };

    return (
        <div className={`day-view ${isOverlay ? 'overlay' : ''} ${!isVisible ? 'closing' : ''}`} style={animationStyle}>
            <div className="header">
                <button onClick={onBack} className="back-btn">← Back</button>
                <div className="date-section">
                    <h2 className="date-title">
                        {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h2>
                </div>
            </div>

            <div className="content">
                <div className="habit-section">
                    <div className="habit-container">
                        <h3 className="section-title">Habits</h3>
                        <div className="habit-list">
                            {habitCalendars.length === 0 ? (
                                <p className="empty-msg">No habits created yet. Create some from the dashboard!</p>
                            ) : (
                                habitCalendars.map(cal => {
                                    const isDone = getHabitStatus(cal.id, date);
                                    return (
                                        <div
                                            key={cal.id}
                                            className={`habit-item ${isDone ? 'completed' : ''} ${cal.type} ${isFuture ? 'future' : ''}`}
                                            onClick={() => handleToggleHabit(cal.id)}
                                        >
                                            <div className="habit-check">
                                                {isDone && '✓'}
                                            </div>
                                            <span className="habit-name">{cal.name}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .day-view { width: 100%; transition: opacity 0.4s ease; }
                .day-view.overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100;
                    background: transparent; display: flex; flex-direction: column;
                    padding: 1.5rem 2rem; pointer-events: none; justify-content: center;
                }
                .day-view.overlay > * { pointer-events: auto; }
                
                .header {
                    position: absolute; top: 1.5rem; left: 2rem; display: flex; z-index: 101;
                }
                .back-btn {
                    background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #fff; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s;
                }
                .back-btn:hover { background: rgba(255, 255, 255, 0.2); transform: translateX(-4px); }
                
                .date-title {
                    font-size: 2.5rem; font-weight: 800; color: #fff; margin-left: 2rem;
                    background: linear-gradient(to right, #fff, #888);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                }

                .content {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .habit-section {
                    width: 100%;
                    max-width: 600px;
                }

                .habit-container {
                    background: rgba(20, 20, 20, 0.6); backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px;
                    padding: 2.5rem; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
                    min-height: 400px; max-height: 70vh; display: flex; flex-direction: column;
                }

                .section-title {
                    font-size: 1.4rem; font-weight: 700; color: #fff; margin: 0 0 2rem 0;
                    padding-bottom: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                }

                .habit-list { display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; padding-right: 0.5rem; }
                
                /* Scrollbar */
                .habit-list::-webkit-scrollbar { width: 5px; }
                .habit-list::-webkit-scrollbar-track { background: transparent; }
                .habit-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 5px; }

                .habit-item {
                    display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem;
                    background: rgba(255, 255, 255, 0.03); border-radius: 15px;
                    cursor: pointer; transition: all 0.2s; border: 1px solid transparent;
                }
                .habit-item:hover { background: rgba(255, 255, 255, 0.06); transform: translateY(-3px); }
                
                .habit-check {
                    width: 28px; height: 28px; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.1);
                    display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem;
                }
                
                .habit-item.habit_good.completed { border-color: #00ff88; background: rgba(0, 255, 136, 0.1); }
                .habit_good.completed .habit_check { background: #00ff88; border-color: #00ff88; color: #000; }
                
                .habit-item.habit_bad.completed { border-color: #ff4444; background: rgba(255, 68, 68, 0.1); }
                .habit_bad.completed .habit_check { background: #ff4444; border-color: #ff4444; color: #fff; }

                .habit-item.future {
                    opacity: 0.3;
                    cursor: not-allowed;
                    pointer-events: none;
                }

                .habit-name {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                }

                .empty-msg { color: #555; text-align: center; margin-top: 3rem; font-size: 1rem; }

                @keyframes zoomIn {
                    0% { opacity: 0; transform: scale(0.6) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }

                @media (max-width: 900px) {
                    .date-title { font-size: 1.8rem; text-align: center; margin: 0; }
                    .header { position: relative; top: 0; left: 0; flex-direction: column; align-items: center; margin-bottom: 2rem; }
                    .habit-container { padding: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default DayView;
