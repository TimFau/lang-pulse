import React from 'react';

interface AutoSpeakToggleProps {
  value: boolean;
  onChange: (checked: boolean) => void;
}

const AutoSpeakToggle: React.FC<AutoSpeakToggleProps> = ({ value, onChange }) => {
  return (
    <div className="auto-speak-toggle">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <label className="switch">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            aria-checked={value}
            aria-label="Automatically speak each question"
          />
          <span className="slider" />
        </label>
        <span>Automatically speak each question</span>
      </div>
    </div>
  );
};

export default AutoSpeakToggle; 