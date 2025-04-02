import React from "react";

const Header = ({
  title = "CBNJuce",
  onPresetChange,
  onSaveClick,
  presets = [],
  currentPreset = "default",
}) => {
  const handlePresetChange = (e) => {
    // Automatically blur to prevent focus style
    e.target.blur();

    if (onPresetChange) {
      onPresetChange(e.target.value);
    }
  };

  const handleSaveClick = () => {
    if (onSaveClick) {
      onSaveClick();
    }
  };

  return (
    <div className="header">
      <div className="title">{title}</div>
      <div className="preset-container">
        <div className="preset-label">Preset:</div>
        <select
          className="preset-dropdown"
          id="presetDropdown"
          value={currentPreset}
          onChange={handlePresetChange}
        >
          {presets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
      <button className="save-button" id="saveButton" onClick={handleSaveClick}>
        Save
      </button>
    </div>
  );
};

export default Header;
