import React from 'react';

export type ViewMode = 'LIFE' | 'YEAR' | 'MONTH' | 'WEEK' | 'DAY';

interface ControlsProps {
  birthDate: string;
  setBirthDate: (date: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  lifeExpectancy: number;
  setLifeExpectancy: (years: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
  birthDate,
  setBirthDate,
  viewMode,
  setViewMode,
  lifeExpectancy,
  setLifeExpectancy
}) => {
  return (
    <div className="controls">
      <div className="control-group">
        <label>Birth Date</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
        />
      </div>

      <div className="control-group">
        <label>View Mode</label>
        <div className="toggle-group">
          {(['LIFE', 'YEAR', 'MONTH', 'WEEK', 'DAY'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={viewMode === mode ? 'active' : ''}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0) + mode.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'LIFE' && (
        <div className="control-group">
          <label>Expectancy (Years)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={lifeExpectancy}
            onChange={(e) => setLifeExpectancy(Number(e.target.value))}
          />
        </div>
      )}

      <style>{`
        .controls {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
        }
        input {
          background: #222;
          border: 1px solid #333;
          color: #fff;
          padding: 0.5rem;
          border-radius: 6px;
          font-family: inherit;
        }
        input:focus {
          outline: none;
          border-color: var(--color-today);
        }
        .toggle-group {
          display: flex;
          background: #222;
          border-radius: 6px;
          padding: 2px;
        }
        .toggle-group button {
          background: transparent;
          border: none;
          color: #666;
          padding: 0.5rem 1rem;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .toggle-group button.active {
          background: #333;
          color: #fff;
        }
        .toggle-group button:hover {
            color: #eee;
        }
      `}</style>
    </div>
  );
};

export default Controls;
