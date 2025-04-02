import React, { useState, useEffect, useRef } from "react";

const Tooltip = ({ text, visible = false, position = { x: 0, y: 0 } }) => {
  const tooltipRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState({ left: "0px", top: "0px" });

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let leftPos = position.x + 10;
    let topPos = position.y - tooltipHeight - 5;

    // Adjust if tooltip would go off edges
    if (leftPos + tooltipWidth > viewportWidth) {
      leftPos = viewportWidth - tooltipWidth - 5;
    }
    if (leftPos < 5) {
      leftPos = 5;
    }
    if (topPos < 5) {
      topPos = position.y + 15;
    }
    if (topPos + tooltipHeight > viewportHeight) {
      topPos = viewportHeight - tooltipHeight - 5;
    }

    setTooltipPos({
      left: `${leftPos}px`,
      top: `${topPos}px`,
    });
  }, [visible, position]);

  return (
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{
        ...tooltipPos,
        opacity: visible ? 1 : 0,
      }}
    >
      {text}
    </div>
  );
};

export default Tooltip;
