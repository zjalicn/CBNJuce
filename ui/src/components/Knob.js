import React, { useState, useEffect, useCallback } from "react";

const Knob = ({
  value = 0.5, // Initial normalized value (0-1)
  onChange, // Callback for value change
  size = "large", // 'large' or 'small'
  label = "", // Label text
  valueFormatter = (val) => `${Math.round(val * 100)}%`, // Format display value
  sensitivity = 0.01, // Mouse movement sensitivity
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(value);

  // Calculate rotation based on value (0 to 1)
  const rotation = 225 + value * 270; // Maps 0-1 to 225-495 degrees (7 to 3 o'clock)

  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);
      setStartY(e.clientY);
      setStartValue(value);
      if (onDragStart) onDragStart();

      // Attach document-level event listeners
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [value, onDragStart]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      // Calculate new value with sensitivity factor
      const newValue = Math.max(
        0,
        Math.min(1, startValue + deltaY * sensitivity)
      );

      if (newValue !== value && onChange) {
        onChange(newValue);
      }
    },
    [isDragging, startY, startValue, sensitivity, value, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    if (onDragEnd) onDragEnd();
  }, [handleMouseMove, onDragEnd]);

  // Clean up event listeners if component unmounts while dragging
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Determine CSS classes based on size
  const knobClass = size === "small" ? "knob-small" : "knob";
  const indicatorClass =
    size === "small" ? "knob-indicator-small" : "knob-indicator";

  // Format the display value
  const displayValue = valueFormatter(value);

  return (
    <div className="knob-container">
      <div className={knobClass} onMouseDown={handleMouseDown}>
        <div
          className={indicatorClass}
          style={{ transform: `translate(-50%, -100%) rotate(${rotation}deg)` }}
        />
      </div>
      {label && <div className="knob-label">{label}</div>}
      <div className="knob-value">{displayValue}</div>
    </div>
  );
};

export default Knob;
