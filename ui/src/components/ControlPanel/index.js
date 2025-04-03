import React from "react";
import "./controlpanel.scss";

const ControlPanel = ({
  title,
  children,
  dropdown = null,
  toggle = null,
  className = "",
  id = "",
}) => {
  return (
    <div className={`control-panel ${className}`} id={id}>
      <div className="controls-title-wrapper">
        {toggle && <div className="toggle-container">{toggle}</div>}
        <div className="controls-title">{title}</div>
        {dropdown && <div className="dropdown-container">{dropdown}</div>}
      </div>
      <div className="control-knobs">{children}</div>
    </div>
  );
};

export default ControlPanel;
