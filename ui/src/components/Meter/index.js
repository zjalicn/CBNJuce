import React, { useEffect, useRef } from "react";
import "./meter.scss";

const Meter = ({
  leftLevel = 0,
  rightLevel = 0,
  label = "",
  isOutput = false,
}) => {
  // Ensure values are in the range [0, 100]
  const safeLeftLevel = Math.max(0, Math.min(100, leftLevel));
  const safeRightLevel = Math.max(0, Math.min(100, rightLevel));

  // Below a small threshold, show as 0 to prevent tiny bars
  const displayLeftHeight = safeLeftLevel <= 0.01 ? "0" : `${safeLeftLevel}%`;
  const displayRightHeight =
    safeRightLevel <= 0.01 ? "0" : `${safeRightLevel}%`;

  // Add output class if this is an output meter
  const barClass = isOutput ? "bar output-bar" : "bar";

  return (
    <div className="meters-column">
      {label && <div className="meters-label">{label}</div>}
      <div className="meters">
        <div className="meter">
          <div className="bar-container">
            <div className={barClass} style={{ height: displayLeftHeight }} />
            <div className="bar-markers">
              <div className="marker marker-0" />
              <div className="marker marker-3" />
              <div className="marker marker-6" />
              <div className="marker marker-10" />
            </div>
          </div>
        </div>
        <div className="meter">
          <div className="bar-container">
            <div className={barClass} style={{ height: displayRightHeight }} />
            <div className="bar-markers">
              <div className="marker marker-0" />
              <div className="marker marker-3" />
              <div className="marker marker-6" />
              <div className="marker marker-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meter;
