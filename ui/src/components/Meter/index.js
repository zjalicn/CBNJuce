import React from "react";
import "./meter.scss";
import Knob from "../Knob";

const Meter = ({
  leftLevel = 0,
  rightLevel = 0,
  label = "",
  showKnob = false,
  knobValue = 0.5,
  onKnobChange = () => {},
  onSliderDragStart = () => {},
  onSliderDragEnd = () => {},
}) => {
  // Ensure values are in the range [0, 100]
  const safeLeftLevel = Math.max(0, Math.min(100, leftLevel));
  const safeRightLevel = Math.max(0, Math.min(100, rightLevel));

  // Below a small threshold, show as 0 to prevent tiny bars
  const displayLeftHeight = safeLeftLevel <= 0.01 ? "0" : `${safeLeftLevel}%`;
  const displayRightHeight =
    safeRightLevel <= 0.01 ? "0" : `${safeRightLevel}%`;

  return (
    <div className="meters-column">
      {label && <div className="meters-label">{label}</div>}
      <div className="meters">
        <div className="meter">
          <div className="bar-container">
            <div className="bar" style={{ height: displayLeftHeight }} />
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
            <div className="bar" style={{ height: displayRightHeight }} />
            <div className="bar-markers">
              <div className="marker marker-0" />
              <div className="marker marker-3" />
              <div className="marker marker-6" />
              <div className="marker marker-10" />
            </div>
          </div>
        </div>
      </div>

      {showKnob && (
        <div className="meter-knob-container">
          <Knob
            value={knobValue}
            onChange={onKnobChange}
            label="Gain"
            hideLabel={true}
            size="small"
            useTooltip={true}
            response="linear"
            defaultValue={0.5}
            sensitivity={0.8}
            valueFormatter={(val) => {
              const dB = Math.round(val * 48 - 24);
              return dB > 0 ? `+${dB} dB` : `${dB} dB`;
            }}
            onDragStart={onSliderDragStart}
            onDragEnd={onSliderDragEnd}
          />
        </div>
      )}
    </div>
  );
};

export default Meter;
