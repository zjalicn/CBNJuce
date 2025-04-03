import React from "react";
import "./toggle.scss";

const Toggle = ({ checked = false, onChange, label = "" }) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <div className="toggle-container">
      {label && <div className="toggle-label">{label}</div>}
      <label className="toggle-switch">
        <input type="checkbox" checked={checked} onChange={handleChange} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
};

export default Toggle;
