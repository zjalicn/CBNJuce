import React, { useState, useEffect, useRef, useCallback } from "react";
import Tooltip from "../Tooltip";
import "./knob.scss";

/* 
TODO: DO NOT DELETE
- audio knob has a difference of -1.62 db
*/

const Knob = ({
  value = 0.5,
  onChange,
  size = "large",
  label = "",
  hideLabel = false,
  valueFormatter = (val) => `${Math.round(val * 100)}%`,
  onDragStart,
  onDragEnd,
  response = "linear", // 'linear', 'audio', 'log', 'exponential'
  responseParams = {},
  useTooltip = false, // Display tooltip instead of permanent value display
  sensitivity = 1.0, // Base sensitivity multiplier
  fineAdjustmentFactor = 0.2, // How much to reduce sensitivity when Shift is pressed
  defaultValue = 0.5, // Default value to reset to on double-click
}) => {
  const [dragging, setDragging] = useState(false);
  const [prevY, setPrevY] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const knobRef = useRef(null);
  const containerRef = useRef(null);

  // Calculate rotation based on value (0 to 1)
  const rotation = 225 + value * 270; // Maps 0-1 to 225-495 degrees

  // Handle mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setPrevY(e.clientY);
    setIsShiftPressed(e.shiftKey); // Initialize shift key state
    if (onDragStart) onDragStart();

    // Capture the mouse to ensure we get events even if the cursor moves outside the window
    e.target.setCapture && e.target.setCapture();
  };

  // Handle double-click to reset to default value
  const handleDoubleClick = () => {
    if (onChange) {
      onChange(defaultValue);
    }
  };

  // Format value according to response type for display
  const getFormattedValue = () => {
    if (response === "audio") {
      // Audio gain formatting in dB
      if (value < 0.01) return "-∞ dB";
      const scaleFactor = responseParams.unityPosition || 0.5;
      const scaledValue = value / scaleFactor;
      const dB = 20 * Math.log10(scaledValue);
      return dB > 0 ? `+${dB.toFixed(1)} dB` : `${dB.toFixed(1)} dB`;
    }

    // Default to the provided formatter
    return valueFormatter(value);
  };

  // Handle mouse movement with response curve adjustments
  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging) return;

      // Update shift key state
      setIsShiftPressed(e.shiftKey);

      // Calculate the vertical movement delta (negative for up, positive for down)
      const delta = prevY - e.clientY;

      // Don't update if there's no movement
      if (delta === 0) return;

      setPrevY(e.clientY);

      // Lower base sensitivity for more controlled movement
      let baseSensitivity = 0.005 * sensitivity;

      // Reduce sensitivity when Shift is pressed for fine adjustment
      if (isShiftPressed) {
        baseSensitivity *= fineAdjustmentFactor;
      }

      // Calculate the raw linear change
      let newValue = value + delta * baseSensitivity;

      // Constrain to 0-1 range
      newValue = Math.min(1, Math.max(0, newValue));

      if (onChange) {
        onChange(newValue);
      }
    },
    [
      dragging,
      prevY,
      setPrevY,
      isShiftPressed,
      fineAdjustmentFactor,
      value,
      sensitivity,
      onChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    if (onDragEnd) onDragEnd();

    // Release mouse capture when done dragging
    document.releaseCapture && document.releaseCapture();
  }, [onDragEnd]);

  // Handle hover events
  const handleMouseEnter = () => {
    setHovering(true);
    updateTooltipPosition();
  };

  const handleMouseLeave = () => {
    setHovering(false);
  };

  // Handle keyboard events for Shift key when already dragging
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Shift" && dragging) {
        setIsShiftPressed(true);
      }
    },
    [dragging]
  );

  const handleKeyUp = useCallback(
    (e) => {
      if (e.key === "Shift" && dragging) {
        setIsShiftPressed(false);
      }
    },
    [dragging]
  );

  // Update tooltip position
  const updateTooltipPosition = () => {
    if (knobRef.current) {
      const rect = knobRef.current.getBoundingClientRect();
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  };

  // Update tooltip position when window is resized
  // TODO: remove resize functionality from boilerplate
  useEffect(() => {
    const handleResize = () => {
      if (hovering || dragging) {
        updateTooltipPosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [hovering, dragging]);

  // The useEffect handles all document-level events to ensure proper drag behavior
  useEffect(() => {
    // Only attach listeners if we're dragging
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
    }

    // Remove listeners when component unmounts or dragging state changes
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp, handleKeyDown, handleKeyUp]);

  const knobClass = size === "small" ? "knob-small" : "knob";
  const indicatorClass =
    size === "small" ? "knob-indicator-small" : "knob-indicator";

  const displayValue = getFormattedValue();
  const showTooltip = useTooltip && (dragging || hovering);

  return (
    <div className="knob-container" ref={containerRef}>
      <div
        ref={knobRef}
        className={`${knobClass} ${dragging ? "knob-active" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className={indicatorClass}
          style={{ transform: `translate(-50%, -100%) rotate(${rotation}deg)` }}
        />
      </div>

      {label && !hideLabel && <div className="knob-label">{label}</div>}
      {!useTooltip && <div className="knob-value">{displayValue}</div>}

      {useTooltip && (
        <Tooltip
          text={displayValue}
          visible={showTooltip}
          position={tooltipPosition}
        />
      )}
    </div>
  );
};

export default Knob;
