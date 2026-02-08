import React, { useState, useEffect } from 'react';
import { getCalendars, createCalendar, deleteCalendar } from '../utils/storage';
import type { CalendarConfig, CalendarType } from '../utils/storage';

interface DashboardProps {
    onNavigate: (view: 'calendar', calendarId: string) => void;
    onOpenView: (view: 'profile' | 'settings') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onOpenView }) => {
    const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newCalendarName, setNewCalendarName] = useState('');
    const [newCalendarType, setNewCalendarType] = useState<CalendarType>('habit_good');

    useEffect(() => {
        setCalendars(getCalendars());
    }, []);

    const handleCreateCalendar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCalendarName.trim()) return;

        const newCal = createCalendar(newCalendarName, newCalendarType);
        setCalendars([...calendars, newCal]);
        setIsModalOpen(false);
        setNewCalendarName('');
        setNewCalendarType('habit_good');
    };

    const handleDeleteCalendar = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (id === 'main') return;
        if (window.confirm('Are you sure you want to delete this calendar? All data will be lost.')) {
            deleteCalendar(id);
            setCalendars(getCalendars());
        }
    };

    const mainCalendar = calendars.find(c => c.id === 'main');
    const habitCalendars = calendars.filter(c => c.id !== 'main');

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Dashboard</h1>
                <p className="dashboard-subtitle">Visualize your journey.</p>
            </header>

            <div className="dashboard-content">
                <main className="main-content-area">
                    {/* General Section */}
                    {mainCalendar && (
                        <section className="section-general">
                            <div className="section-header">
                                <h2>General</h2>
                            </div>
                            <div className="general-card-container">
                                <div
                                    className="calendar-card general-card"
                                    onClick={() => onNavigate('calendar', mainCalendar.id)}
                                >
                                    <div className="card-preview">
                                        <div className="preview-dot main"></div>
                                        <div className="preview-dot"></div>
                                        <div className="preview-dot active"></div>
                                    </div>
                                    <div className="card-info">
                                        <h3>{mainCalendar.name}</h3>
                                        <p>Comprehensive Life Overview</p>
                                    </div>
                                    <div className="card-glow"></div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Habit Calendars Section */}
                    <section className="section-habits">
                        <div className="section-header">
                            <h2>Habit Calendars</h2>
                            <button
                                className="add-calendar-btn"
                                title="Add New Habit"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <span className="plus-icon">+</span>
                            </button>
                        </div>

                        <div className="calendar-grid">
                            {habitCalendars.length === 0 ? (
                                <div className="empty-habits" onClick={() => setIsModalOpen(true)}>
                                    <div className="plus-huge">+</div>
                                    <p>Add your first habit tracker</p>
                                </div>
                            ) : (
                                habitCalendars.map(cal => (
                                    <div
                                        key={cal.id}
                                        className="calendar-card"
                                        onClick={() => onNavigate('calendar', cal.id)}
                                    >
                                        <button
                                            className="delete-card-btn"
                                            onClick={(e) => handleDeleteCalendar(e, cal.id)}
                                            title="Delete Calendar"
                                        >
                                            ×
                                        </button>
                                        <div className="card-preview">
                                            <div className={`preview-dot ${cal.type === 'habit_good' ? 'good' : 'bad'}`}></div>
                                            <div className="preview-dot"></div>
                                            <div className="preview-dot active"></div>
                                        </div>
                                        <div className="card-info">
                                            <h3>{cal.name}</h3>
                                            <p>{cal.type === 'habit_good' ? 'Good Habit' : 'Bad Habit'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </main>

                <aside className="dashboard-sidebar">
                    <div className="sidebar-item" onClick={() => onOpenView('profile')}>
                        <span className="icon">👤</span>
                        <span>Profile</span>
                    </div>
                    <div className="sidebar-item" onClick={() => onOpenView('settings')}>
                        <span className="icon">⚙️</span>
                        <span>Settings</span>
                    </div>
                </aside>
            </div>

            {/* Create Calendar Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Create New Habit</h3>
                        <form onSubmit={handleCreateCalendar}>
                            <input
                                type="text"
                                placeholder="Calendar Name (e.g., Gym, Smoking)"
                                value={newCalendarName}
                                onChange={e => setNewCalendarName(e.target.value)}
                                autoFocus
                            />
                            <div className="type-selector">
                                <label className={`type-option ${newCalendarType === 'habit_good' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="habit_good"
                                        checked={newCalendarType === 'habit_good'}
                                        onChange={() => setNewCalendarType('habit_good')}
                                    />
                                    Good Habit (Green)
                                </label>
                                <label className={`type-option ${newCalendarType === 'habit_bad' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="type"
                                        value="habit_bad"
                                        checked={newCalendarType === 'habit_bad'}
                                        onChange={() => setNewCalendarType('habit_bad')}
                                    />
                                    Bad Habit (Red)
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="create-btn">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            <style>{`
                .dashboard-container {
                    width: 100%;
                    height: 100vh;
                    padding: 4rem;
                    display: flex;
                    flex-direction: column;
                    gap: 3rem;
                    color: #fff;
                    animation: fadeIn 0.5s ease-out;
                    max-width: 1400px;
                    overflow: hidden; /* Container doesn't scroll */
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dashboard-header h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    margin: 0;
                    background: linear-gradient(to right, #fff, #555);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: -0.04em;
                }

                .dashboard-subtitle {
                    color: #444;
                    font-size: 1.1rem;
                    margin-top: 0.5rem;
                    font-weight: 500;
                }

                .dashboard-content {
                    display: grid;
                    grid-template-columns: 1fr 280px;
                    gap: 6rem;
                    flex: 1;
                    min-height: 0; /* Important for nested scroll */
                }

                .main-content-area {
                    display: flex;
                    flex-direction: column;
                    gap: 4rem;
                    overflow-y: auto;
                    padding-right: 2rem; /* Space for scrollbar */
                    padding-bottom: 4rem;
                }

                /* Custom Scrollbar for sleek look */
                .main-content-area::-webkit-scrollbar {
                    width: 6px;
                }
                .main-content-area::-webkit-scrollbar-track {
                    background: transparent;
                }
                .main-content-area::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .main-content-area::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    padding-bottom: 0.8rem;
                }

                .section-header h2 {
                    font-size: 1.3rem;
                    font-weight: 700;
                    margin: 0;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .general-card-container {
                    max-width: 500px;
                }

                .general-card {
                    background: linear-gradient(135deg, rgba(40, 40, 40, 0.4), rgba(20, 20, 20, 0.6));
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    padding: 2.5rem !important;
                }

                .general-card .card-info h3 {
                    font-size: 1.8rem;
                }

                .card-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at 100% 0%, rgba(255,255,255,0.05), transparent 60%);
                    pointer-events: none;
                }

                .empty-habits {
                    grid-column: 1 / -1;
                    height: 200px;
                    border: 2px dashed rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    color: #444;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .empty-habits:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                    color: #888;
                    background: rgba(255, 255, 255, 0.01);
                }

                .plus-huge {
                    font-size: 3rem;
                    line-height: 1;
                }

                .add-calendar-btn {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .add-calendar-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                    border-color: rgba(255, 255, 255, 0.4);
                }

                .plus-icon {
                    font-size: 24px;
                    line-height: 1;
                    margin-top: -2px;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 2rem;
                }

                .calendar-card {
                    background: rgba(30, 30, 30, 0.4);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 2rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    position: relative;
                    overflow: hidden;
                }

                .calendar-card:hover {
                    transform: translateY(-8px);
                    background: rgba(45, 45, 45, 0.6);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
                }

                .delete-card-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(255, 68, 68, 0.1);
                    border: 1px solid rgba(255, 68, 68, 0.2);
                    color: #ff4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0;
                    transition: all 0.2s;
                    z-index: 10;
                }

                .calendar-card:hover .delete-card-btn {
                    opacity: 1;
                }

                .delete-card-btn:hover {
                    background: #ff4444;
                    color: #fff;
                    transform: scale(1.2);
                }

                .card-preview {
                    display: flex;
                    gap: 8px;
                }

                .preview-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: #333;
                }
                
                .preview-dot.good { background: #00ff88; box-shadow: 0 0 10px rgba(0, 255, 136, 0.5); }
                .preview-dot.bad { background: #ff4444; box-shadow: 0 0 10px rgba(255, 68, 68, 0.5); }
                .preview-dot.main { background: #fff; box-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }

                .preview-dot.active {
                    opacity: 1;
                }

                .card-info h3 {
                    margin: 0;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .card-info p {
                    margin: 0.5rem 0 0 0;
                    font-size: 0.9rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 500;
                }

                /* Sidebar */
                .dashboard-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    border-left: 1px solid rgba(255, 255, 255, 0.05);
                    padding-left: 2rem;
                    position: sticky;
                    top: 0;
                    height: flex-start;
                }

                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 1rem;
                    font-weight: 500;
                }

                .sidebar-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    transform: translateX(4px);
                }

                .sidebar-item .icon {
                    font-size: 1.4rem;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeInModal 0.3s ease-out;
                }

                @keyframes fadeInModal {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-content {
                    background: #1a1a1a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 3rem;
                    border-radius: 24px;
                    width: 450px;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.8);
                }
                
                .modal-content h3 { 
                    margin-top: 0; 
                    margin-bottom: 2rem;
                    color: #fff;
                    font-size: 1.8rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }
                
                .modal-content input[type="text"] {
                    width: 100%;
                    padding: 1rem 1.25rem;
                    background: #252525;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #fff;
                    margin-bottom: 2rem;
                    font-size: 1.1rem;
                    transition: all 0.2s;
                }
                
                .modal-content input[type="text"]:focus {
                    outline: none;
                    border-color: rgba(255, 255, 255, 0.3);
                    background: #2a2a2a;
                }

                .type-selector {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }

                .type-option {
                    flex: 1;
                    padding: 1.25rem;
                    background: #252525;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    transition: all 0.2s;
                    font-size: 1rem;
                    color: #666;
                    font-weight: 600;
                }

                .type-option:hover {
                    background: #2a2a2a;
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .type-option.selected {
                    background: #333;
                    border-color: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }
                
                .type-option.selected[data-type="habit_good"] {
                    border-color: rgba(0, 255, 136, 0.4);
                }

                .type-option.selected[data-type="habit_bad"] {
                    border-color: rgba(255, 68, 68, 0.4);
                }

                .type-option input {
                    display: none;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .modal-actions button {
                    padding: 0.8rem 1.5rem;
                    border-radius: 12px;
                    cursor: pointer;
                    border: none;
                    background: transparent;
                    color: #666;
                    font-weight: 600;
                    transition: all 0.2s;
                    font-size: 1rem;
                }
                
                .modal-actions button:hover {
                    color: #fff;
                }

                .modal-actions button.create-btn {
                    background: #fff;
                    color: #000;
                    font-weight: 700;
                    box-shadow: 0 10px 20px rgba(255, 255, 255, 0.1);
                }
                
                .modal-actions button.create-btn:hover {
                    background: #eee;
                    transform: translateY(-2px);
                    box-shadow: 0 15px 30px rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div >
    );
};

export default Dashboard;
