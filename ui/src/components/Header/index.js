import React from "react";
import "./header.scss";

const Header = ({
  title,
  onPresetChange,
  onSaveClick,
  presets = [],
  currentPreset = "default",
}) => {
  return (
    <div className="header">
      <div className="title">{title}</div>
    </div>
  );
};

export default Header;
