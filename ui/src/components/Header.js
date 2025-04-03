import React from "react";

const Header = ({
  title = "CBNJuce",
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
