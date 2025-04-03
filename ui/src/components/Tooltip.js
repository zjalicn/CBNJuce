import React, { useState, useEffect, useRef } from "react";

const Tooltip = ({ text, visible = false, position = { x: 0, y: 0 } }) => {
  const tooltipRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ left: "0px", top: "0px" });

  // Debug tooltip props
  useEffect(() => {
    console.log("Tooltip: visible=", visible);
    console.log("Tooltip: position=", position);
    console.log("Tooltip: text=", text);
  }, [visible, position, text]);

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position the tooltip above the target element
    let leftPos = position.x;
    let topPos = position.y - tooltipHeight - 10; // 10px above the target

    // Adjust if tooltip would go off edges
    if (leftPos + tooltipWidth > viewportWidth) {
      leftPos = viewportWidth - tooltipWidth - 5;
    }
    if (leftPos < 5) {
      leftPos = 5;
    }
    if (topPos < 5) {
      // If it would go off the top, position it below the target instead
      topPos = position.y + 15;
    }
    if (topPos + tooltipHeight > viewportHeight) {
      topPos = viewportHeight - tooltipHeight - 5;
    }

    const newPos = {
      left: `${leftPos}px`,
      top: `${topPos}px`,
    };

    console.log("Tooltip: Setting position", newPos);
    setTooltipPos(newPos);
  }, [visible, position]);

  return (
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{
        ...tooltipPos,
        opacity: visible ? 1 : 0,
        position: "fixed", // Use fixed positioning for better control
        zIndex: 9999, // Ensure it's above other elements
      }}
    >
      {text}
    </div>
  );
};

export default Tooltip;
