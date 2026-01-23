import React, { useState, useEffect } from 'react';

interface DayViewProps {
    date: Date;
    onBack: () => void;
    initialPosition?: { x: number, y: number };
    isOverlay?: boolean;
}

interface ChecklistItem {
    id: string;
    text: string;
    checked: boolean;
}

const DayView: React.FC<DayViewProps> = ({ date, onBack, initialPosition, isOverlay }) => {

    const [items, setItems] = useState<ChecklistItem[]>(() => {
        const key = `checklist-${date.toISOString().split('T')[0]}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    });

    const [newItemText, setNewItemText] = useState('');
    const [progress, setProgress] = useState(0);

    // Calculate progress
    useEffect(() => {
        const calculateProgress = () => {
            const now = new Date();
            const targetDate = new Date(date);

            const isToday =
                now.getDate() === targetDate.getDate() &&
                now.getMonth() === targetDate.getMonth() &&
                now.getFullYear() === targetDate.getFullYear();

            const isPast = targetDate < new Date(now.setHours(0, 0, 0, 0));

            if (isPast && !isToday) {
                setProgress(100);
            } else if (isToday) {
                const totalMinutes = 24 * 60;
                const passedMinutes = now.getHours() * 60 + now.getMinutes();
                setProgress((passedMinutes / totalMinutes) * 100);
            } else {
                setProgress(0);
            }
        };

        calculateProgress();
        const interval = setInterval(calculateProgress, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [date]);


    // Save items
    useEffect(() => {
        const key = `checklist-${date.toISOString().split('T')[0]}`;
        localStorage.setItem(key, JSON.stringify(items));
    }, [items, date]);


    const addItem = () => {
        if (!newItemText.trim()) return;
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            text: newItemText,
            checked: false
        };
        setItems([...items, newItem]);
        setNewItemText('');
    };

    const toggleItem = (id: string) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const deleteItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };


    // Animation Style
    const animationStyle: React.CSSProperties = initialPosition ? {
        transformOrigin: `${initialPosition.x}px ${initialPosition.y}px`,
        animation: 'zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
    } : {
        animation: 'fadeIn 0.3s ease'
    };

    return (
        <div className={`day-view ${isOverlay ? 'overlay' : ''}`} style={animationStyle}>
            <div className="header">
                <button onClick={onBack} className="back-btn">← Back</button>
            </div>

            <div className="content">
                {/* LEFT COLUMN: Visualizer */}
                <div className="visualizer-section">
                    <div className="visualizer-container">
                        <div
                            className="progress-circle"
                            style={{
                                background: `conic-gradient(var(--color-today) ${progress}%, #222 ${progress}%)`
                            }}
                        >
                            <div className="inner-circle">
                                <span className="percentage-text">{progress.toFixed(1)}%</span>
                                <span className="label-text">
                                    {progress >= 100 ? 'COMPLETED' : 'DAY PASSED'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Checklist */}
                <div className="checklist-section">
                    <div className="checklist-header">
                        <h3>Day Checklist</h3>
                        <p className="date-subtitle">{date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="input-group">
                        <input
                            type="text"
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addItem()}
                            placeholder="Add task..."
                        />
                        <button onClick={addItem}>+</button>
                    </div>
                    <ul className="checklist">
                        {items.map(item => (
                            <li key={item.id} className={item.checked ? 'checked' : ''}>
                                <div className="checkbox-wrapper" onClick={() => toggleItem(item.id)}>
                                    <div className={`checkbox ${item.checked ? 'checked' : ''}`} />
                                    <span>{item.text}</span>
                                </div>
                                <button className="delete-btn" onClick={() => deleteItem(item.id)}>×</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <style>{`
                .day-view {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                }
                .day-view.overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 100;
                    background: transparent; /* Rely on backdrop filter if needed, or parent */
                    display: flex;
                    flex-direction: column;
                    padding: 4rem 2rem;
                    pointer-events: none; /* Let clicks pass through empty areas if needed */
                }
                .day-view.overlay > * {
                    pointer-events: auto;
                }
                
                .header {
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: flex-start;
                }

                .back-btn {
                    background: rgba(30, 30, 30, 0.8);
                    backdrop-filter: blur(8px);
                    border: 1px solid #444;
                    color: #fff;
                    padding: 0.6rem 1.2rem;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                }
                .back-btn:hover {
                    background: #333;
                    transform: translateY(-2px);
                    border-color: #666;
                }
                
                .content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    align-items: start;
                    width: 100%;
                }
                @media (max-width: 768px) {
                    .content { grid-template-columns: 1fr; gap: 2rem; }
                }

                /* Visualizer Styles */
                .visualizer-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                }
                .visualizer-container {
                    padding: 2rem;
                    background: rgba(20, 20, 20, 0.6);
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .progress-circle {
                    width: 280px;
                    height: 280px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 50px rgba(0,0,0,0.3);
                    transition: background 1s ease;
                }
                .inner-circle {
                    width: 240px;
                    height: 240px;
                    background: #111;
                    border-radius: 50%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
                }
                .percentage-text {
                    font-size: 3.5rem;
                    font-weight: 800;
                    color: #fff;
                    background: linear-gradient(to bottom, #fff, #aaa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .label-text {
                    color: #666;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    margin-top: 0.5rem;
                    font-weight: 600;
                }

                /* Checklist Styles */
                .checklist-section {
                    background: rgba(26, 26, 26, 0.85);
                    backdrop-filter: blur(12px);
                    padding: 2rem;
                    border-radius: 24px;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    height: 100%;
                    min-height: 400px;
                }
                .checklist-header {
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 1rem;
                }
                .checklist-header h3 { 
                    margin: 0; 
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #fff;
                }
                .date-subtitle {
                    color: #888;
                    font-size: 0.95rem;
                    margin: 0.4rem 0 0 0;
                }
                
                .input-group {
                    display: flex;
                    gap: 0.8rem;
                    margin-bottom: 1.5rem;
                }
                .input-group input {
                    flex: 1;
                    background: rgba(0,0,0,0.3);
                    border: 1px solid #333;
                    padding: 1rem;
                    border-radius: 12px;
                    color: white;
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                .input-group input:focus {
                    outline: none;
                    border-color: var(--color-today);
                }
                .input-group button {
                    background: var(--color-today);
                    color: #000;
                    border: none;
                    width: 50px;
                    border-radius: 12px;
                    font-size: 1.8rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s;
                }
                .input-group button:hover {
                    transform: scale(1.05);
                }

                .checklist {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .checklist li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: rgba(255,255,255,0.03);
                    margin-bottom: 0.8rem;
                    border-radius: 12px;
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                .checklist li:hover {
                    background: rgba(255,255,255,0.06);
                    border-color: rgba(255,255,255,0.1);
                }
                .checklist li.checked {
                    opacity: 0.5;
                }
                
                .checkbox-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                    flex: 1;
                }
                .checkbox {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #555;
                    border-radius: 6px;
                    position: relative;
                    transition: all 0.2s;
                }
                .checkbox.checked {
                    background: var(--color-today);
                    border-color: var(--color-today);
                }
                .checkbox.checked::after {
                    content: '✓';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: #000;
                    font-size: 14px;
                    font-weight: bold;
                }
                .delete-btn {
                    background: transparent;
                    border: none;
                    color: #666;
                    cursor: pointer;
                    font-size: 1.4rem;
                    padding: 0 0.5rem;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .checklist li:hover .delete-btn {
                    opacity: 1;
                }
                .delete-btn:hover { color: #ff4444; }

                /* Animations */
                @keyframes zoomIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.8) translateY(20px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DayView;
